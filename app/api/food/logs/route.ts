/**
 * GET /api/food/logs?date=YYYY-MM-DD
 * Returns food logs for the given date, grouped by meal type.
 * Defaults to today if no date provided.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { groupLogsByMeal } from "@/lib/mealGrouping";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : new Date().toISOString().slice(0, 10);

  const { data: logs, error } = await supabase
    .from("food_logs")
    .select("id, product_name, brand, meal_type, quantity_g, calories_kcal, logged_at, nutrients_json")
    .eq("user_id", user.id)
    .eq("log_date", date)
    .order("logged_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped = groupLogsByMeal(logs ?? []);
  return NextResponse.json({ date, grouped });
}
