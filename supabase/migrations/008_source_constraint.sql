-- Migration 008: Fix food_logs_source_check to include 'usda'.
-- Drops whatever version of the constraint is currently on the table
-- (original from 002 or the 004 variant) and replaces it with a clean set.
-- Safe to run multiple times.

ALTER TABLE public.food_logs
  DROP CONSTRAINT IF EXISTS food_logs_source_check;

ALTER TABLE public.food_logs
  ADD CONSTRAINT food_logs_source_check
    CHECK (source IN ('openfoodfacts', 'manual', 'fdc', 'usda'));

-- Reload PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
