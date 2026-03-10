-- VegSage — Row Level Security policies
-- Run AFTER schema.sql
-- Enables RLS on all tables and restricts access to the owning user.

-- ===================================================
-- profiles
-- ===================================================
alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: insert own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid());

-- No delete policy — handled by cascade from auth.users

-- ===================================================
-- foods_cache
-- ===================================================
alter table public.foods_cache enable row level security;

create policy "foods_cache: select own"
  on public.foods_cache for select
  using (user_id = auth.uid());

create policy "foods_cache: insert own"
  on public.foods_cache for insert
  with check (user_id = auth.uid());

create policy "foods_cache: update own"
  on public.foods_cache for update
  using (user_id = auth.uid());

create policy "foods_cache: delete own"
  on public.foods_cache for delete
  using (user_id = auth.uid());

-- ===================================================
-- meals
-- ===================================================
alter table public.meals enable row level security;

create policy "meals: select own"
  on public.meals for select
  using (user_id = auth.uid());

create policy "meals: insert own"
  on public.meals for insert
  with check (user_id = auth.uid());

create policy "meals: update own"
  on public.meals for update
  using (user_id = auth.uid());

create policy "meals: delete own"
  on public.meals for delete
  using (user_id = auth.uid());

-- ===================================================
-- meal_items
-- RLS via meal_id join (user must own the meal)
-- ===================================================
alter table public.meal_items enable row level security;

create policy "meal_items: select via meal"
  on public.meal_items for select
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = auth.uid()
    )
  );

create policy "meal_items: insert via meal"
  on public.meal_items for insert
  with check (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = auth.uid()
    )
  );

create policy "meal_items: delete via meal"
  on public.meal_items for delete
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = auth.uid()
    )
  );

-- ===================================================
-- daily_scores
-- ===================================================
alter table public.daily_scores enable row level security;

create policy "daily_scores: select own"
  on public.daily_scores for select
  using (user_id = auth.uid());

create policy "daily_scores: insert own"
  on public.daily_scores for insert
  with check (user_id = auth.uid());

create policy "daily_scores: update own"
  on public.daily_scores for update
  using (user_id = auth.uid());

-- ===================================================
-- insights
-- ===================================================
alter table public.insights enable row level security;

create policy "insights: select own"
  on public.insights for select
  using (user_id = auth.uid());

create policy "insights: insert own"
  on public.insights for insert
  with check (user_id = auth.uid());

create policy "insights: update own"
  on public.insights for update
  using (user_id = auth.uid());

create policy "insights: delete own"
  on public.insights for delete
  using (user_id = auth.uid());

-- ===================================================
-- Service role bypass (for recalculate + webhook routes)
-- The service role key bypasses RLS automatically in Supabase.
-- No additional policy needed; do not expose service role to client.
-- ===================================================
