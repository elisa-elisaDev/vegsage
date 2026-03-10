-- Migration 007: Ensure meal_type column exists and reload PostgREST schema cache.
-- Safe to run multiple times (IF NOT EXISTS guard).

ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS meal_type text NOT NULL DEFAULT 'lunch'
    CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));

-- Force PostgREST to reload its schema cache so the column is visible immediately.
NOTIFY pgrst, 'reload schema';
