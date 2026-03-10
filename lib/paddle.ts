/**
 * Paddle server-side helpers — Paddle Billing API v2
 * All Paddle API calls are server-only. Never expose secrets to the client.
 *
 * Docs: https://developer.paddle.com/api-reference/transactions/create-transaction
 */

const PADDLE_API_BASE = "https://api.paddle.com";

export const PRICE_IDS: Record<"monthly" | "yearly", string> = {
  monthly: process.env.PADDLE_PRICE_MONTHLY ?? "",
  yearly:  process.env.PADDLE_PRICE_YEARLY  ?? "",
};

/**
 * Create a Paddle hosted-checkout transaction and return the checkout URL.
 * The user is redirected to this URL to complete payment.
 *
 * Return URL after payment: configure in Paddle Dashboard →
 *   Developer Tools → Checkout settings → Return URL
 *   Recommended value: https://<your-domain>/settings?upgraded=1
 */
export async function createCheckoutUrl(opts: {
  plan: "monthly" | "yearly";
  userId: string;
  email: string;
}): Promise<string> {
  const priceId = PRICE_IDS[opts.plan];
  if (!priceId) {
    throw new Error(`No price ID configured for plan "${opts.plan}". Set PADDLE_PRICE_MONTHLY / PADDLE_PRICE_YEARLY.`);
  }

  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("PADDLE_API_KEY is not set");

  // Paddle Billing API v2 — POST /transactions
  // customer_email  : pre-fills the checkout email field
  // custom_data     : forwarded to every webhook for this transaction/subscription
  const body = {
    items: [{ price_id: priceId, quantity: 1 }],
    customer_email: opts.email,
    custom_data: { userId: opts.userId },
  };

  const res = await fetch(`${PADDLE_API_BASE}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paddle API ${res.status}: ${err}`);
  }

  const json = await res.json();
  // Paddle Billing v2 response: { data: { checkout: { url: "https://..." } } }
  const url = (json?.data?.checkout?.url as string | undefined) ?? null;
  if (!url) throw new Error("Paddle returned no checkout URL — check API key and price IDs");
  return url;
}

/**
 * Verify a Paddle webhook signature (HMAC-SHA256).
 * Header format: "ts=<unix-timestamp>;h1=<hex-digest>"
 * Signed payload: "<ts>:<raw-body>"
 */
export async function verifyPaddleWebhook(
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PADDLE_WEBHOOK_SECRET is not set — webhook verification disabled");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    // Parse "ts=1234;h1=abcd..." safely (value may contain "=")
    const parts: Record<string, string> = {};
    for (const segment of signatureHeader.split(";")) {
      const eq = segment.indexOf("=");
      if (eq > 0) parts[segment.slice(0, eq)] = segment.slice(eq + 1);
    }

    const ts = parts["ts"];
    const h1 = parts["h1"];
    if (!ts || !h1) return false;

    const signedPayload = `${ts}:${rawBody}`;
    const sigBytes = hexToBytes(h1);

    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      encoder.encode(signedPayload),
    );
  } catch (e) {
    console.error("Paddle webhook signature verification threw:", e);
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/** Resolve a Paddle price ID to its plan label. */
export function resolvePlan(priceId: string): "monthly" | "yearly" | null {
  if (priceId === PRICE_IDS.monthly) return "monthly";
  if (priceId === PRICE_IDS.yearly)  return "yearly";
  return null;
}
