/**
 * POST /api/paddle/webhook
 * Handles all Paddle Billing webhook events.
 *
 * Security:  HMAC-SHA256 signature verified before any processing.
 * Idempotent: duplicate event IDs are skipped.
 *
 * Events handled:
 *   subscription.created / subscription.activated  → is_premium = true
 *   subscription.updated                            → refresh period + plan
 *   subscription.paused                             → is_premium = false
 *   subscription.resumed                            → is_premium = true
 *   subscription.canceled                           → deferred or immediate revoke
 *   subscription.expired                            → is_premium = false
 *   subscription.past_due                           → acknowledge (grace period)
 *   transaction.completed                           → is_premium = true (one-time / initial)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { verifyPaddleWebhook, resolvePlan } from "@/lib/paddle";

// Fallback to hardcoded IDs so the guard works even when env vars are absent.
const OUR_PRICE_IDS = new Set([
  process.env.PADDLE_PRICE_MONTHLY ?? "pri_01kjvxwzppnmmvz44qk306hk22",
  process.env.PADDLE_PRICE_YEARLY  ?? "pri_01kjvy0jc2pmeh57v8ympzcjyk",
]);

export async function POST(req: NextRequest) {
  // ── 1. Signature verification ───────────────────────────────
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") ?? "";

  const isValid = await verifyPaddleWebhook(rawBody, signature);
  if (!isValid) {
    console.error("Paddle webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 2. Parse event ──────────────────────────────────────────
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId   = (event.event_id ?? event.id) as string | undefined;
  const eventType = event.event_type as string | undefined;
  const data      = event.data as Record<string, unknown> | undefined;

  console.info("[paddle] event_type:", eventType, "event_id:", eventId);

  if (!eventId || !eventType || !data) {
    console.warn("[paddle] missing eventId/eventType/data — skipping");
    return NextResponse.json({ ok: true }); // unknown shape — acknowledge
  }

  const supabase = createAdminSupabaseClient();

  // ── 3. Idempotency ──────────────────────────────────────────
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("paddle_last_event_id", eventId)
    .maybeSingle();

  if (existing) {
    console.info("[paddle] duplicate event_id — skipped:", eventId);
    return NextResponse.json({ ok: true, skipped: true });
  }

  // ── 4. Extract user ID from custom_data ─────────────────────
  // custom_data is set in createCheckoutUrl and propagated by Paddle
  // to all subscription/transaction events.
  const rawCustomData = data.custom_data as Record<string, string> | undefined;
  const userId = rawCustomData?.userId;

  console.info("[paddle] custom_data:", JSON.stringify(rawCustomData), "userId:", userId);

  if (!userId) {
    console.warn("[paddle] no userId in custom_data — cannot update profile. event:", eventType, eventId);
    return NextResponse.json({ ok: true, note: "no userId in custom_data" });
  }

  // ── 5. Extract common fields ────────────────────────────────
  // subscription.* events:  data.id = subscription ID
  // transaction.* events:   data.id = transaction ID,  data.subscription_id = sub ID
  const isSubscriptionEvent = eventType.startsWith("subscription.");
  const subscriptionId = (
    isSubscriptionEvent
      ? data.id
      : (data.subscription_id ?? null)
  ) as string | undefined;

  const customerId = data.customer_id as string | undefined;

  // Items / price
  const items = data.items as Array<Record<string, unknown>> | undefined;
  const item0 = items?.[0];
  const item0price = item0?.price as Record<string, unknown> | undefined;
  // subscription events: item.price.id | transaction events: item.price_id
  const priceId = (
    (item0?.price_id ?? item0price?.id) as string | undefined
  );

  console.info("[paddle] priceId:", priceId, "subscriptionId:", subscriptionId, "customerId:", customerId);

  // Guard: ignore events for other products
  if (priceId && !OUR_PRICE_IDS.has(priceId)) {
    console.warn("[paddle] priceId not in OUR_PRICE_IDS — skipping. priceId:", priceId);
    return NextResponse.json({ ok: true, note: "Not our product" });
  }

  const plan = priceId ? resolvePlan(priceId) : null;

  // Billing period
  const billingPeriod = data.current_billing_period as Record<string, unknown> | undefined;
  const currentPeriodEnd = billingPeriod?.ends_at as string | undefined;

  // Scheduled change (used for deferred cancellation)
  const scheduledChange = data.scheduled_change as Record<string, unknown> | undefined;
  const scheduledEffectiveAt = scheduledChange?.effective_at as string | undefined;

  // ── 6. Build profile + subscription updates ─────────────────
  const baseUpdate: Record<string, unknown> = {
    paddle_last_event_id: eventId,
    premium_updated_at:   new Date().toISOString(),
  };

  let profileUpdate: Record<string, unknown> = { ...baseUpdate };
  let subscriptionStatus: string | null = null;
  let cancelAtPeriodEnd = false;

  switch (eventType) {

    // ── Activation ──────────────────────────────────────────
    case "transaction.completed":
    case "subscription.created":
    case "subscription.activated":
      profileUpdate = {
        ...baseUpdate,
        is_premium:              true,
        premium_source:          "paddle",
        premium_expires_at:      currentPeriodEnd ?? null,
        paddle_customer_id:      customerId ?? null,
        paddle_subscription_id:  subscriptionId ?? null,
        paddle_plan:             plan,
      };
      subscriptionStatus = "active";
      break;

    // ── Renewal / plan change ────────────────────────────────
    case "subscription.updated":
      profileUpdate = {
        ...baseUpdate,
        is_premium:             true,
        premium_expires_at:     currentPeriodEnd ?? null,
        paddle_plan:            plan ?? undefined,
        paddle_subscription_id: subscriptionId ?? null,
      };
      subscriptionStatus = "active";
      break;

    // ── Paused (payment failed / user paused) ────────────────
    case "subscription.paused":
      profileUpdate = {
        ...baseUpdate,
        is_premium:         false,
        premium_expires_at: null,
      };
      subscriptionStatus = "paused";
      break;

    // ── Resumed after pause ──────────────────────────────────
    case "subscription.resumed":
      profileUpdate = {
        ...baseUpdate,
        is_premium:         true,
        premium_expires_at: currentPeriodEnd ?? null,
      };
      subscriptionStatus = "active";
      break;

    // ── Cancellation (may be deferred to period end) ─────────
    case "subscription.canceled": {
      if (scheduledEffectiveAt && new Date(scheduledEffectiveAt) > new Date()) {
        // User retains access until end of billing period
        profileUpdate = {
          ...baseUpdate,
          premium_expires_at: scheduledEffectiveAt, // access until this date
        };
        subscriptionStatus = "active"; // still paying access
        cancelAtPeriodEnd = true;
      } else {
        // Immediate revocation
        profileUpdate = {
          ...baseUpdate,
          is_premium:         false,
          premium_expires_at: null,
          paddle_plan:        null,
        };
        subscriptionStatus = "canceled";
      }
      break;
    }

    // ── Fully expired ────────────────────────────────────────
    case "subscription.expired":
      profileUpdate = {
        ...baseUpdate,
        is_premium:         false,
        premium_expires_at: null,
        paddle_plan:        null,
      };
      subscriptionStatus = "expired";
      break;

    // ── Past due (payment failed, grace period) ──────────────
    // Keep is_premium as-is; Supabase will reflect the current state.
    // Paddle will retry payment and send subscription.activated on success.
    case "subscription.past_due":
      profileUpdate = { ...baseUpdate };
      subscriptionStatus = "past_due";
      break;

    default:
      return NextResponse.json({ ok: true, note: `Unhandled event: ${eventType}` });
  }

  // ── 7. Update profiles ──────────────────────────────────────
  console.info("[paddle] updating profile for userId:", userId, "update:", JSON.stringify(profileUpdate));
  const { data: updatedRows, error: profileErr } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId)
    .select("id");

  if (profileErr) {
    console.error("[paddle] profile update error:", profileErr);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }
  if (!updatedRows || updatedRows.length === 0) {
    console.error("[paddle] profile update matched 0 rows — userId not found in profiles:", userId);
    return NextResponse.json({ error: "profile not found" }, { status: 500 });
  }
  console.info("[paddle] profile updated successfully for userId:", userId);

  // ── 8. Upsert subscriptions table ──────────────────────────
  // Only upsert when we have both a subscription ID and a price ID;
  // priceId may be absent for some transaction.completed events.
  if (subscriptionId && subscriptionStatus && priceId) {
    const { error: subErr } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id:                userId,
          paddle_subscription_id: subscriptionId,
          status:                 subscriptionStatus,
          price_id:               priceId,
          paddle_customer_id:     customerId ?? null,
          cancel_at_period_end:   cancelAtPeriodEnd,
          paddle_last_event_id:   eventId,
          ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
        },
        { onConflict: "paddle_subscription_id" },
      );

    if (subErr) {
      // Non-fatal: profile already updated; log and continue
      console.error("Paddle webhook: subscriptions upsert failed", subErr);
    }
  }

  console.info(`Paddle webhook OK: ${eventType} for user ${userId}`);
  return NextResponse.json({ ok: true });
}
