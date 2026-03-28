/**
 * POST /api/paddle/webhook
 * Handles all Paddle Billing webhook events.
 *
 * Security: HMAC-SHA256 signature verified before any processing.
 * Idempotent: duplicate event IDs are skipped.
 *
 * Events handled:
 *   subscription.created / subscription.activated  → is_premium = true
 *   subscription.updated                           → refresh period + plan
 *   subscription.paused                            → is_premium = false
 *   subscription.resumed                           → is_premium = true
 *   subscription.canceled                          → deferred or immediate revoke
 *   subscription.expired                           → is_premium = false
 *   subscription.past_due                          → acknowledge (grace period)
 *   transaction.completed                          → is_premium = true (one-time / initial)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabaseServer";
import { verifyPaddleWebhook, resolvePlan } from "@/lib/paddle";

function getRequiredEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const PADDLE_PRICE_MONTHLY = getRequiredEnv(
  process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY,
  "NEXT_PUBLIC_PADDLE_PRICE_MONTHLY"
);

const PADDLE_PRICE_YEARLY = getRequiredEnv(
  process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY,
  "NEXT_PUBLIC_PADDLE_PRICE_YEARLY"
);

const OUR_PRICE_IDS = new Set([PADDLE_PRICE_MONTHLY, PADDLE_PRICE_YEARLY]);

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") ?? "";

  const isValid = await verifyPaddleWebhook(rawBody, signature);
  if (!isValid) {
    console.error("Paddle webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = (event.event_id ?? event.id) as string | undefined;
  const eventType = event.event_type as string | undefined;
  const data = event.data as Record<string, unknown> | undefined;

  console.info("[paddle] event_type:", eventType, "event_id:", eventId);

  if (!eventId || !eventType || !data) {
    console.warn("[paddle] missing eventId/eventType/data — skipping");
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminSupabaseClient();
  console.info(
    "[paddle] admin client initialised, service key present:",
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("paddle_last_event_id", eventId)
    .maybeSingle();

  if (existing) {
    console.info("[paddle] duplicate event_id — skipped:", eventId);
    return NextResponse.json({ ok: true, skipped: true });
  }

  const rawCustomData = data.custom_data as Record<string, string> | undefined;
  let userId = rawCustomData?.userId;
  const customerId = data.customer_id as string | undefined;

  console.info(
    "[paddle] custom_data:",
    JSON.stringify(rawCustomData),
    "userId:",
    userId,
    "customerId:",
    customerId
  );

  if (!userId && customerId) {
    const { data: fallbackProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("paddle_customer_id", customerId)
      .maybeSingle();

    if (fallbackProfile?.id) {
      userId = fallbackProfile.id;
      console.info(
        "[paddle] userId resolved via paddle_customer_id fallback:",
        customerId,
        "→",
        userId
      );
    }
  }

  if (!userId) {
    console.warn(
      "[paddle] no userId — cannot update profile. event:",
      eventType,
      eventId,
      "Ensure Paddle.Checkout.open passes customData: { userId }."
    );
    return NextResponse.json({ ok: true, note: "no userId in custom_data" });
  }

  const isSubscriptionEvent = eventType.startsWith("subscription.");
  const subscriptionId = (
    isSubscriptionEvent ? data.id : (data.subscription_id ?? null)
  ) as string | undefined;

  const items = data.items as Array<Record<string, unknown>> | undefined;
  const item0 = items?.[0];
  const item0price = item0?.price as Record<string, unknown> | undefined;
  const priceId = (item0?.price_id ?? item0price?.id) as string | undefined;

  console.info(
    "[paddle] priceId:",
    priceId,
    "subscriptionId:",
    subscriptionId,
    "customerId:",
    customerId
  );

  if (priceId && !OUR_PRICE_IDS.has(priceId)) {
    console.warn(
      "[paddle] priceId not in OUR_PRICE_IDS — skipping. priceId:",
      priceId
    );
    return NextResponse.json({ ok: true, note: "Not our product" });
  }

  const plan = priceId ? resolvePlan(priceId) : null;

  const billingPeriod = data.current_billing_period as
    | Record<string, unknown>
    | undefined;
  const currentPeriodEnd = billingPeriod?.ends_at as string | undefined;

  const scheduledChange = data.scheduled_change as
    | Record<string, unknown>
    | undefined;
  const scheduledEffectiveAt = scheduledChange?.effective_at as
    | string
    | undefined;

  const baseUpdate: Record<string, unknown> = {
    paddle_last_event_id: eventId,
    premium_updated_at: new Date().toISOString(),
  };

  let profileUpdate: Record<string, unknown> = { ...baseUpdate };
  let subscriptionStatus: string | null = null;
  let cancelAtPeriodEnd = false;

  switch (eventType) {
    case "transaction.completed":
    case "subscription.created":
    case "subscription.activated":
      profileUpdate = {
        ...baseUpdate,
        is_premium: true,
        premium_source: "paddle",
        premium_expires_at: currentPeriodEnd ?? null,
        paddle_customer_id: customerId ?? null,
        paddle_subscription_id: subscriptionId ?? null,
        paddle_plan: plan,
      };
      subscriptionStatus = "active";
      break;

    case "subscription.updated":
      profileUpdate = {
        ...baseUpdate,
        is_premium: true,
        premium_expires_at: currentPeriodEnd ?? null,
        paddle_plan: plan ?? undefined,
        paddle_subscription_id: subscriptionId ?? null,
      };
      subscriptionStatus = "active";
      break;

    case "subscription.paused":
      profileUpdate = {
        ...baseUpdate,
        is_premium: false,
        premium_expires_at: null,
      };
      subscriptionStatus = "paused";
      break;

    case "subscription.resumed":
      profileUpdate = {
        ...baseUpdate,
        is_premium: true,
        premium_expires_at: currentPeriodEnd ?? null,
      };
      subscriptionStatus = "active";
      break;

    case "subscription.canceled": {
      if (scheduledEffectiveAt && new Date(scheduledEffectiveAt) > new Date()) {
        profileUpdate = {
          ...baseUpdate,
          premium_expires_at: scheduledEffectiveAt,
        };
        subscriptionStatus = "active";
        cancelAtPeriodEnd = true;
      } else {
        profileUpdate = {
          ...baseUpdate,
          is_premium: false,
          premium_expires_at: null,
          paddle_plan: null,
        };
        subscriptionStatus = "canceled";
      }
      break;
    }

    case "subscription.expired":
      profileUpdate = {
        ...baseUpdate,
        is_premium: false,
        premium_expires_at: null,
        paddle_plan: null,
      };
      subscriptionStatus = "expired";
      break;

    case "subscription.past_due":
      profileUpdate = { ...baseUpdate };
      subscriptionStatus = "past_due";
      break;

    default:
      return NextResponse.json({
        ok: true,
        note: `Unhandled event: ${eventType}`,
      });
  }

  console.info(
    "[paddle] updating profile for userId:",
    userId,
    "update:",
    JSON.stringify(profileUpdate)
  );

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
    console.error(
      "[paddle] profile update matched 0 rows — userId not found in profiles:",
      userId
    );
    return NextResponse.json({ error: "profile not found" }, { status: 500 });
  }

  console.info("[paddle] profile updated successfully for userId:", userId);

  if (subscriptionId && subscriptionStatus && priceId) {
    const { error: subErr } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          paddle_subscription_id: subscriptionId,
          status: subscriptionStatus,
          price_id: priceId,
          paddle_customer_id: customerId ?? null,
          cancel_at_period_end: cancelAtPeriodEnd,
          paddle_last_event_id: eventId,
          ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
        },
        { onConflict: "paddle_subscription_id" }
      );

    if (subErr) {
      console.error("Paddle webhook: subscriptions upsert failed", subErr);
    }
  }

  console.info(`Paddle webhook OK: ${eventType} for user ${userId}`);
  return NextResponse.json({ ok: true });
}