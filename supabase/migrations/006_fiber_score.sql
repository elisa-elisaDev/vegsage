-- Migration 006: Update compute_daily_summary to use fiber instead of zinc
-- New weights: b12:0.20, iron:0.20, protein:0.20, calcium:0.20, omega3:0.10, fiber:0.10
-- (fiber totals are already stored in totals_json from migration 004)

CREATE OR REPLACE FUNCTION compute_daily_summary(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_b12     numeric := 0;
  v_iron    numeric := 0;
  v_protein numeric := 0;
  v_calcium numeric := 0;
  v_omega3  numeric := 0;
  v_fiber   numeric := 0;
  v_fat     numeric := 0;
  v_carbs   numeric := 0;
  v_sugar   numeric := 0;
  v_sodium  numeric := 0;
  v_calories numeric := 0;

  c_b12     numeric := 2.4;
  c_iron    numeric := 14;
  c_protein numeric := 50;
  c_calcium numeric := 1000;
  c_omega3  numeric := 1.6;
  c_fiber   numeric := 25;

  w_b12     numeric := 0.20;
  w_iron    numeric := 0.20;
  w_protein numeric := 0.20;
  w_calcium numeric := 0.20;
  w_omega3  numeric := 0.10;
  w_fiber   numeric := 0.10;

  s_b12     numeric;
  s_ir      numeric;
  s_pr      numeric;
  s_ca      numeric;
  s_o3      numeric;
  s_fi      numeric;

  v_global  numeric;
  v_log_count integer;
BEGIN
  -- Aggregate nutrient totals from food_logs for the given user and date
  SELECT
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'b12')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'iron')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'protein')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'calcium')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'omega3')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'fiber')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'fat')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'carbs')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'sugar')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(
      COALESCE((nutrients_json->'per100g'->>'sodium')::numeric, 0) * quantity_g / 100
    ), 0),
    COALESCE(SUM(calories_kcal), 0),
    COUNT(*)
  INTO
    v_b12, v_iron, v_protein, v_calcium, v_omega3, v_fiber,
    v_fat, v_carbs, v_sugar, v_sodium, v_calories, v_log_count
  FROM food_logs
  WHERE user_id = p_user_id AND log_date = p_date;

  -- Per-nutrient score 0–100 (capped at 100)
  s_b12 := LEAST(v_b12 / NULLIF(c_b12, 0), 1) * 100;
  s_ir  := LEAST(v_iron / NULLIF(c_iron, 0), 1) * 100;
  s_pr  := LEAST(v_protein / NULLIF(c_protein, 0), 1) * 100;
  s_ca  := LEAST(v_calcium / NULLIF(c_calcium, 0), 1) * 100;
  s_o3  := LEAST(v_omega3 / NULLIF(c_omega3, 0), 1) * 100;
  s_fi  := LEAST(v_fiber / NULLIF(c_fiber, 0), 1) * 100;

  -- B12 special rule: if 0 intake → score = 0
  IF v_b12 = 0 THEN s_b12 := 0; END IF;

  -- Weighted global score (0–100)
  v_global :=
    s_b12 * w_b12 +
    s_ir  * w_iron +
    s_pr  * w_protein +
    s_ca  * w_calcium +
    s_o3  * w_omega3 +
    s_fi  * w_fiber;

  -- Upsert into daily_summaries
  INSERT INTO daily_summaries (
    user_id,
    summary_date,
    confidence_score,
    log_count,
    breakdown_json,
    totals_json,
    updated_at
  )
  VALUES (
    p_user_id,
    p_date,
    ROUND(v_global::numeric, 1),
    v_log_count,
    jsonb_build_object(
      'b12',     ROUND(s_b12::numeric, 1),
      'iron',    ROUND(s_ir::numeric,  1),
      'protein', ROUND(s_pr::numeric,  1),
      'calcium', ROUND(s_ca::numeric,  1),
      'omega3',  ROUND(s_o3::numeric,  1),
      'fiber',   ROUND(s_fi::numeric,  1)
    ),
    jsonb_build_object(
      'b12',      ROUND(v_b12::numeric,     3),
      'iron',     ROUND(v_iron::numeric,    3),
      'protein',  ROUND(v_protein::numeric, 3),
      'calcium',  ROUND(v_calcium::numeric, 3),
      'omega3',   ROUND(v_omega3::numeric,  3),
      'fiber',    ROUND(v_fiber::numeric,   3),
      'fat',      ROUND(v_fat::numeric,     3),
      'carbs',    ROUND(v_carbs::numeric,   3),
      'sugar',    ROUND(v_sugar::numeric,   3),
      'sodium',   ROUND(v_sodium::numeric,  3),
      'calories', ROUND(v_calories::numeric, 1)
    ),
    NOW()
  )
  ON CONFLICT (user_id, summary_date) DO UPDATE SET
    confidence_score = EXCLUDED.confidence_score,
    log_count        = EXCLUDED.log_count,
    breakdown_json   = EXCLUDED.breakdown_json,
    totals_json      = EXCLUDED.totals_json,
    updated_at       = EXCLUDED.updated_at;
END;
$$;
