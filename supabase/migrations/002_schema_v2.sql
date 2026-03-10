-- VegSage — Schema v2
-- Run AFTER schema.sql + rls.sql OR as a fresh start.
-- Safe to run multiple times (IF NOT EXISTS / IF EXISTS).
-- ============================================================

-- ── 1. Update profiles ──────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('fr', 'de', 'en')),
  ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz NULL;

-- Ensure vegetarian_type exists (from original schema)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vegetarian_type text NOT NULL DEFAULT 'ovo_lacto'
    CHECK (vegetarian_type IN ('ovo_lacto', 'lacto', 'ovo', 'vegan'));

-- ── 2. food_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.food_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at        timestamptz NOT NULL DEFAULT now(),
  log_date         date NOT NULL DEFAULT CURRENT_DATE,
  source           text NOT NULL DEFAULT 'openfoodfacts'
                     CHECK (source IN ('openfoodfacts', 'manual', 'fdc')),
  product_name     text NOT NULL,
  brand            text NULL,
  barcode          text NULL,
  off_id           text NULL,
  serving_size_g   numeric NOT NULL DEFAULT 100,
  quantity_g       numeric NOT NULL CHECK (quantity_g > 0),
  calories_kcal    numeric NOT NULL DEFAULT 0,
  nutrients_json   jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- nutrients_json schema: { per100g: { b12, iron, protein, calcium, omega3, zinc, calories } }
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS food_logs_user_date
  ON public.food_logs (user_id, log_date DESC);

CREATE INDEX IF NOT EXISTS food_logs_user_logged_at
  ON public.food_logs (user_id, logged_at DESC);

-- ── 3. daily_summaries ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_date      date NOT NULL,
  totals_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- totals_json: { calories, b12, iron, protein, calcium, omega3, zinc }
  confidence_score  numeric NOT NULL DEFAULT 0
                      CHECK (confidence_score >= 0 AND confidence_score <= 100),
  breakdown_json    jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- breakdown_json: { b12: 0-100, iron: 0-100, ... }
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, summary_date)
);

CREATE INDEX IF NOT EXISTS daily_summaries_user_date
  ON public.daily_summaries (user_id, summary_date DESC);

-- ── 4. subscriptions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id text UNIQUE,
  status                 text NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','canceled','past_due','paused','trialing','expired')),
  price_id               text NOT NULL,
  -- monthly: pri_01kjvxwzppnmmvz44qk306hk22 | yearly: pri_01kjvy0jc2pmeh57v8ympzcjyk
  current_period_end     timestamptz NULL,
  paddle_customer_id     text NULL,
  paddle_last_event_id   text NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user
  ON public.subscriptions (user_id);

-- ── 5. RLS ────────────────────────────────────────────────────

-- food_logs
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_logs: select own" ON public.food_logs;
CREATE POLICY "food_logs: select own"
  ON public.food_logs FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "food_logs: insert own" ON public.food_logs;
CREATE POLICY "food_logs: insert own"
  ON public.food_logs FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "food_logs: delete own" ON public.food_logs;
CREATE POLICY "food_logs: delete own"
  ON public.food_logs FOR DELETE USING (user_id = auth.uid());

-- daily_summaries
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_summaries: select own" ON public.daily_summaries;
CREATE POLICY "daily_summaries: select own"
  ON public.daily_summaries FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "daily_summaries: insert own" ON public.daily_summaries;
CREATE POLICY "daily_summaries: insert own"
  ON public.daily_summaries FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "daily_summaries: update own" ON public.daily_summaries;
CREATE POLICY "daily_summaries: update own"
  ON public.daily_summaries FOR UPDATE USING (user_id = auth.uid());

-- subscriptions (read-only for user; writes via service role in webhook)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions: select own" ON public.subscriptions;
CREATE POLICY "subscriptions: select own"
  ON public.subscriptions FOR SELECT USING (user_id = auth.uid());

-- profiles: extend existing policies
-- is_premium and premium_expires_at must only be set by service role (webhook).
-- locale and vegetarian_type can be set by the user.
-- No change to existing profile policies — service role bypasses RLS.

-- ── 6. Helper: compute daily summary ─────────────────────────
CREATE OR REPLACE FUNCTION public.compute_daily_summary(
  p_user_id uuid,
  p_date    date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_totals jsonb;
  v_score  numeric;
  v_b12    numeric; v_iron   numeric; v_protein numeric;
  v_cal    numeric; v_omega3 numeric; v_zinc    numeric;
  v_kcal   numeric;
  -- Targets
  c_b12    constant numeric := 2.4;
  c_iron   constant numeric := 14;
  c_prot   constant numeric := 50;
  c_cal    constant numeric := 1000;
  c_om3    constant numeric := 1.6;
  c_zinc   constant numeric := 10;
  -- Weights
  w_b12    constant numeric := 0.20;
  w_iron   constant numeric := 0.20;
  w_prot   constant numeric := 0.20;
  w_cal    constant numeric := 0.15;
  w_om3    constant numeric := 0.15;
  w_zinc   constant numeric := 0.10;
BEGIN
  -- Sum nutrients for the day
  SELECT
    COALESCE(SUM((nutrients_json->'per100g'->>'calories')::numeric * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'b12')::numeric     * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'iron')::numeric    * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'protein')::numeric * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'calcium')::numeric * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'omega3')::numeric  * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'zinc')::numeric    * quantity_g / 100), 0)
  INTO v_kcal, v_b12, v_iron, v_protein, v_cal, v_omega3, v_zinc
  FROM public.food_logs
  WHERE user_id = p_user_id AND log_date = p_date;

  v_totals := jsonb_build_object(
    'calories', ROUND(v_kcal::numeric, 1),
    'b12',      ROUND(v_b12::numeric, 2),
    'iron',     ROUND(v_iron::numeric, 2),
    'protein',  ROUND(v_protein::numeric, 1),
    'calcium',  ROUND(v_cal::numeric, 1),
    'omega3',   ROUND(v_omega3::numeric, 2),
    'zinc',     ROUND(v_zinc::numeric, 2)
  );

  -- 7-day rolling avg for score
  -- (simplified: use today's day for MVP speed)
  DECLARE
    s_b12 numeric := LEAST(v_b12 / c_b12,   1) * 100;
    s_ir  numeric := LEAST(v_iron / c_iron,  1) * 100;
    s_pr  numeric := LEAST(v_protein / c_prot,  1) * 100;
    s_ca  numeric := LEAST(v_cal / c_cal,    1) * 100;
    s_om  numeric := LEAST(v_omega3 / c_om3, 1) * 100;
    s_zn  numeric := LEAST(v_zinc / c_zinc,  1) * 100;
  BEGIN
    IF v_b12 = 0 THEN s_b12 := 0; END IF;
    v_score := ROUND(
      s_b12 * w_b12 + s_ir * w_iron + s_pr * w_prot +
      s_ca  * w_cal  + s_om * w_om3  + s_zn * w_zinc,
      1
    );
    INSERT INTO public.daily_summaries
      (user_id, summary_date, totals_json, confidence_score, breakdown_json, updated_at)
    VALUES (
      p_user_id, p_date, v_totals, v_score,
      jsonb_build_object(
        'b12', ROUND(s_b12, 1), 'iron', ROUND(s_ir, 1),
        'protein', ROUND(s_pr, 1), 'calcium', ROUND(s_ca, 1),
        'omega3', ROUND(s_om, 1), 'zinc', ROUND(s_zn, 1)
      ),
      now()
    )
    ON CONFLICT (user_id, summary_date) DO UPDATE
      SET totals_json      = EXCLUDED.totals_json,
          confidence_score = EXCLUDED.confidence_score,
          breakdown_json   = EXCLUDED.breakdown_json,
          updated_at       = now();
  END;
END;
$$;
