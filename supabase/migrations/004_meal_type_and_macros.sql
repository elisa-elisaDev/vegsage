-- VegSage — Migration 004: meal_type column + macro totals
-- Safe to run multiple times.

-- ── 1. Add meal_type to food_logs ────────────────────────────────────────────

ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS meal_type text NOT NULL DEFAULT 'lunch'
    CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));

-- ── 2. Fix source CHECK to accept 'FDC' (uppercase) ─────────────────────────

ALTER TABLE public.food_logs
  DROP CONSTRAINT IF EXISTS food_logs_source_check;

ALTER TABLE public.food_logs
  ADD CONSTRAINT food_logs_source_check
    CHECK (source IN ('openfoodfacts', 'manual', 'fdc', 'FDC'));

-- ── 3. Update compute_daily_summary to include macros ────────────────────────

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
  v_totals  jsonb;
  v_score   numeric;
  v_kcal    numeric;
  v_b12     numeric; v_iron    numeric; v_protein numeric;
  v_cal     numeric; v_omega3  numeric; v_zinc    numeric;
  v_fat     numeric; v_carbs   numeric; v_fiber   numeric;
  v_sugar   numeric; v_sodium  numeric;
  -- Micro targets
  c_b12     constant numeric := 2.4;
  c_iron    constant numeric := 14;
  c_prot    constant numeric := 50;
  c_cal     constant numeric := 1000;
  c_om3     constant numeric := 1.6;
  c_zinc    constant numeric := 10;
  -- Score weights
  w_b12     constant numeric := 0.20;
  w_iron    constant numeric := 0.20;
  w_prot    constant numeric := 0.20;
  w_cal     constant numeric := 0.15;
  w_om3     constant numeric := 0.15;
  w_zinc    constant numeric := 0.10;
BEGIN
  SELECT
    COALESCE(SUM((nutrients_json->'per100g'->>'calories')::numeric * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'b12')::numeric      * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'iron')::numeric     * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'protein')::numeric  * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'calcium')::numeric  * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'omega3')::numeric   * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'zinc')::numeric     * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'fat')::numeric      * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'carbs')::numeric    * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'fiber')::numeric    * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'sugar')::numeric    * quantity_g / 100), 0),
    COALESCE(SUM((nutrients_json->'per100g'->>'sodium')::numeric   * quantity_g / 100), 0)
  INTO v_kcal, v_b12, v_iron, v_protein, v_cal, v_omega3, v_zinc,
       v_fat, v_carbs, v_fiber, v_sugar, v_sodium
  FROM public.food_logs
  WHERE user_id = p_user_id AND log_date = p_date;

  v_totals := jsonb_build_object(
    'calories', ROUND(v_kcal::numeric,    1),
    'protein',  ROUND(v_protein::numeric, 1),
    'fat',      ROUND(v_fat::numeric,     1),
    'carbs',    ROUND(v_carbs::numeric,   1),
    'fiber',    ROUND(v_fiber::numeric,   1),
    'sugar',    ROUND(v_sugar::numeric,   1),
    'sodium',   ROUND(v_sodium::numeric,  1),
    'b12',      ROUND(v_b12::numeric,     2),
    'iron',     ROUND(v_iron::numeric,    2),
    'calcium',  ROUND(v_cal::numeric,     1),
    'omega3',   ROUND(v_omega3::numeric,  2),
    'zinc',     ROUND(v_zinc::numeric,    2)
  );

  DECLARE
    s_b12 numeric := LEAST(v_b12 / c_b12,      1) * 100;
    s_ir  numeric := LEAST(v_iron / c_iron,     1) * 100;
    s_pr  numeric := LEAST(v_protein / c_prot,  1) * 100;
    s_ca  numeric := LEAST(v_cal / c_cal,       1) * 100;
    s_om  numeric := LEAST(v_omega3 / c_om3,    1) * 100;
    s_zn  numeric := LEAST(v_zinc / c_zinc,     1) * 100;
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
        'b12',     ROUND(s_b12, 1),
        'iron',    ROUND(s_ir,  1),
        'protein', ROUND(s_pr,  1),
        'calcium', ROUND(s_ca,  1),
        'omega3',  ROUND(s_om,  1),
        'zinc',    ROUND(s_zn,  1)
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
