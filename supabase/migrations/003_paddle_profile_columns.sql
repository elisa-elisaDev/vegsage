-- VegSage — Migration 003: Paddle billing columns on profiles + subscriptions
-- Safe to run multiple times (IF NOT EXISTS / IF EXISTS).
-- Run in Supabase Dashboard → SQL Editor.
-- ============================================================

-- ── 1. profiles: add Paddle-specific columns ────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium           boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_source       text        NULL,
  ADD COLUMN IF NOT EXISTS premium_updated_at   timestamptz NULL,
  ADD COLUMN IF NOT EXISTS paddle_customer_id   text        NULL,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text      NULL,
  ADD COLUMN IF NOT EXISTS paddle_plan          text        NULL,
  ADD COLUMN IF NOT EXISTS paddle_last_event_id text        NULL;

-- ── 2. subscriptions: add cancel_at_period_end + updated_at trigger ─
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean     NOT NULL DEFAULT false;

-- updated_at auto-refresh trigger (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. Index for fast lookup by paddle_subscription_id on profiles ─
CREATE INDEX IF NOT EXISTS profiles_paddle_subscription_id
  ON public.profiles (paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_paddle_last_event_id
  ON public.profiles (paddle_last_event_id)
  WHERE paddle_last_event_id IS NOT NULL;
