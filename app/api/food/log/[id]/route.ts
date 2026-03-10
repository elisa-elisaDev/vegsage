/**
 * DELETE /api/food/log/[id]
 * Removes a food log entry and recomputes the daily summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabaseServer";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch first to confirm ownership and get the log_date for summary recomputation.
  const { data: log, error: fetchError } = await supabase
    .from("food_logs")
    .select("id, log_date, user_id")
    .eq("id", id)
    .eq("user_id", user.id) // RLS double-check
    .maybeSingle();

  if (fetchError || !log) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("food_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Recompute daily summary for the affected date.
  const admin = createAdminSupabaseClient();
  await admin.rpc("compute_daily_summary", {
    p_user_id: user.id,
    p_date:    log.log_date,
  });
  // Non-fatal — dashboard falls back to client-side totals if RPC fails.

  return NextResponse.json({ ok: true });
}
