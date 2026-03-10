-- VegSage — Migration 005: daily_goals_json on profiles
-- Safe to run multiple times.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_goals_json jsonb NULL DEFAULT NULL;

-- Optional index for fast reads (profile is already fetched by PK; this is a safety net).
-- No index needed — goals are always fetched as part of the full profile row.
