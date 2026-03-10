-- VegSage — Supabase schema
-- Run this file in the Supabase SQL Editor (Project > SQL Editor > New Query)
-- before running rls.sql

-- ===================================================
-- Extensions
-- ===================================================
create extension if not exists "uuid-ossp";

-- ===================================================
-- A) profiles
-- Automatically created on user signup via trigger.
-- ===================================================
create table if not exists public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  email                  text,
  vegetarian_type        text not null default 'ovo_lacto'
                           check (vegetarian_type in ('ovo_lacto', 'lacto', 'ovo', 'vegan')),
  is_premium             boolean not null default false,
  premium_source         text null,
  premium_updated_at     timestamptz null,
  paddle_customer_id     text null,
  paddle_subscription_id text null,
  paddle_plan            text null
                           check (paddle_plan in ('monthly', 'yearly', null)),
  paddle_last_event_id   text null,
  created_at             timestamptz not null default now()
);

-- Trigger: create profile row on new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===================================================
-- B) foods_cache
-- Per-user private cache of food items used.
-- ===================================================
create table if not exists public.foods_cache (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  source           text not null check (source in ('OFF', 'USER', 'FDC')),
  off_id           text null,
  barcode          text null,
  name             text not null,
  vegetarian_flag  boolean null,
  vegan_flag       boolean null,
  nutrients        jsonb not null,
  -- nutrients schema: { "per100g": { "calories": n|null, "b12": n|null, ... } }
  created_at       timestamptz not null default now(),
  last_used_at     timestamptz not null default now()
);

create index if not exists foods_cache_user_barcode
  on public.foods_cache (user_id, barcode);

create index if not exists foods_cache_user_last_used
  on public.foods_cache (user_id, last_used_at desc);

-- Unique constraint for OFF foods per user
create unique index if not exists foods_cache_user_off_id
  on public.foods_cache (user_id, off_id)
  where off_id is not null;

-- ===================================================
-- C) meals
-- One row per user per day.
-- ===================================================
create table if not exists public.meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  meal_date  date not null,
  created_at timestamptz not null default now(),
  unique (user_id, meal_date)
);

create index if not exists meals_user_date
  on public.meals (user_id, meal_date desc);

-- ===================================================
-- D) meal_items
-- ===================================================
create table if not exists public.meal_items (
  id         uuid primary key default gen_random_uuid(),
  meal_id    uuid not null references public.meals(id) on delete cascade,
  food_id    uuid not null references public.foods_cache(id),
  quantity_g numeric not null check (quantity_g > 0),
  created_at timestamptz not null default now()
);

create index if not exists meal_items_meal
  on public.meal_items (meal_id);

-- ===================================================
-- E) daily_scores
-- ===================================================
create table if not exists public.daily_scores (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  day          date not null,
  global_score numeric not null check (global_score >= 0 and global_score <= 100),
  breakdown    jsonb not null,  -- { b12: n, iron: n, protein: n, calcium: n, omega3: n, zinc: n }
  totals       jsonb not null,  -- daily totals incl. calories + all nutrients
  created_at   timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists daily_scores_user_day
  on public.daily_scores (user_id, day desc);

-- ===================================================
-- F) insights
-- ===================================================
create table if not exists public.insights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nutrient   text not null check (nutrient in ('b12','iron','protein','calcium','omega3','zinc')),
  severity   text not null check (severity in ('high','medium')),
  message    text not null,
  day        date not null,
  dismissed  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, day, nutrient)
);

create index if not exists insights_user_day
  on public.insights (user_id, day desc, dismissed);

-- ===================================================
-- Helper RPC: get meal items for a day (used by recalculate)
-- ===================================================
create or replace function public.get_meal_items_for_day(
  p_user_id uuid,
  p_day date
)
returns table (
  quantity_g numeric,
  nutrients  jsonb
)
language sql stable security definer
set search_path = public as $$
  select
    mi.quantity_g,
    fc.nutrients
  from public.meal_items mi
  join public.meals m on m.id = mi.meal_id
  join public.foods_cache fc on fc.id = mi.food_id
  where m.user_id = p_user_id
    and m.meal_date = p_day;
$$;
