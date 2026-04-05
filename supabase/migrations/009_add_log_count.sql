-- Migration 009: Add missing log_count column to daily_summaries.
-- Migration 006 updated compute_daily_summary to INSERT log_count but
-- no migration ever added the column — causing every RPC call to fail
-- silently and leaving daily_summaries permanently empty.
-- Safe to run multiple times (IF NOT EXISTS guard).

ALTER TABLE public.daily_summaries
  ADD COLUMN IF NOT EXISTS log_count integer NOT NULL DEFAULT 0;

-- Reload PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
