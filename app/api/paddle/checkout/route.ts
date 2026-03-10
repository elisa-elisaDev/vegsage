/**
 * POST /api/paddle/checkout
 * Creates a Paddle hosted-checkout transaction for the authenticated user.
 * Returns { checkoutUrl } — the client redirects to it.
 *
 * After payment, Paddle redirects to the Return URL configured in:
 *   Paddle Dashboard → Developer Tools → Checkout settings → Return URL
 *   Set it to: https://<your-domain>/settings?upgraded=1
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createCheckoutUrl } from "@/lib/paddle";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let plan: "monthly" | "yearly";
  try {
    const body = await req.json();
    if (body.plan !== "monthly" && body.plan !== "yearly") {
      throw new Error("Invalid plan");
    }
    plan = body.plan;
  } catch {
    return NextResponse.json(
      { error: "Invalid plan. Use 'monthly' or 'yearly'." },
      { status: 400 },
    );
  }

  try {
    const checkoutUrl = await createCheckoutUrl({
      plan,
      userId: user.id,
      email: user.email ?? "",
    });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("Paddle checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
