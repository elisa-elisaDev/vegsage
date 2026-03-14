/**
 * POST /api/food/log
 * Logs a food entry for today, then recomputes the daily summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";
import type { FoodProduct } from "@/lib/usdaClient";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
  type MealType = typeof MEAL_TYPES[number];

  let product: FoodProduct;
  let quantityG: number;
  let mealType: MealType;

  try {
    const body = await req.json();
    product = body.product;
    quantityG = Number(body.quantityG);
    mealType = MEAL_TYPES.includes(body.mealType) ? body.mealType : "lunch";
    if (!product || !product.per100g || !Number.isFinite(quantityG) || quantityG <= 0 || quantityG > 2000) {
      throw new Error("Invalid body");
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const factor = quantityG / 100;
  const p = product.per100g;
  const caloriesKcal = (p.calories ?? 0) * factor;

  // Store raw per100g values — the DB function scales by quantity_g/100 when computing summaries
  const nutrientsJson = { per100g: p };

  const today = new Date().toISOString().slice(0, 10);

  const { error: insertError } = await supabase.from("food_logs").insert({
    user_id: user.id,
    log_date: today,
    source: "usda",
    meal_type: mealType,
    product_name: product.name,
    brand: product.brand ?? null,
    off_id: product.off_id ?? null,
    serving_size_g: quantityG,
    quantity_g: quantityG,
    calories_kcal: caloriesKcal,
    nutrients_json: nutrientsJson,
  });

  if (insertError) {
    console.error("food_log insert error:", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Recompute the daily summary via DB function
  const admin = createAdminSupabaseClient();
  const requestId = crypto.randomUUID();
  const { error: rpcError } = await admin.rpc("compute_daily_summary", {
    p_user_id: user.id,
    p_date: today,
  });

  // Non-fatal: log structured error — dashboard falls back to client-side totals from food_logs.
  let summaryStatus: "ok" | "fallback" = "ok";
  if (rpcError) {
    summaryStatus = "fallback";
    console.error(
      JSON.stringify({
        event: "compute_daily_summary_failed",
        requestId,
        userId: user.id,
        date: today,
        message: rpcError.message,
        code: rpcError.code,
      })
    );
  }

  return NextResponse.json({ ok: true, summaryStatus });
}
