/**
 * Paddle server-side helpers — Paddle Billing API v2
 * All Paddle API calls are server-only. Never expose secrets to the client.
 *
 * Docs: https://developer.paddle.com/api-reference/transactions/create-transaction
 */

function getRequiredEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getPaddleEnvironment(): "sandbox" | "production" {
  const environment = getRequiredEnv(
    process.env.NEXT_PUBLIC_PADDLE_ENV,
    "NEXT_PUBLIC_PADDLE_ENV"
  );

  if (environment !== "sandbox" && environment !== "production") {
    throw new Error(
      "Invalid NEXT_PUBLIC_PADDLE_ENV value. Expected 'sandbox' or 'production'."
    );
  }

  return environment;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

const PADDLE_ENV = getPaddleEnvironment();

const PADDLE_API_BASE =
  PADDLE_ENV === "sandbox"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

export const PRICE_IDS: Record<"monthly" | "yearly", string> = {
  monthly: getRequiredEnv(
    process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY,
    "NEXT_PUBLIC_PADDLE_PRICE_MONTHLY"
  ),
  yearly: getRequiredEnv(
    process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY,
    "NEXT_PUBLIC_PADDLE_PRICE_YEARLY"
  ),
};

/**
 * Create a Paddle hosted-checkout transaction and return the checkout URL.
 * The user is redirected to this URL to complete payment.
 *
 * Return URL after payment: configure in Paddle Dashboard →
 * Developer Tools → Checkout settings → Return URL
 * Recommended value: https://<your-domain>/settings?upgraded=1
 */
export async function createCheckoutUrl(opts: {
  plan: "monthly" | "yearly";
  userId: string;
  email: string;
}): Promise<string> {
  const priceId = PRICE_IDS[opts.plan];
  const apiKey = getRequiredEnv(process.env.PADDLE_API_KEY, "PADDLE_API_KEY");

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
  const url = (json?.data?.checkout?.url as string | undefined) ?? null;

  if (!url) {
    throw new Error(
      "Paddle returned no checkout URL — check API key and price IDs."
    );
  }

  return url;
}

/**
 * Verify a Paddle webhook signature (HMAC-SHA256).
 * Header format: "ts=<unix-timestamp>;h1=<hex-digest>"
 * Signed payload: "<ts>:<raw-body>"
 */
export async function verifyPaddleWebhook(
  rawBody: string,
  signatureHeader: string
): Promise<boolean> {
  const secret = getRequiredEnv(
    process.env.PADDLE_WEBHOOK_SECRET,
    "PADDLE_WEBHOOK_SECRET"
  );

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const parts: Record<string, string> = {};

    for (const segment of signatureHeader.split(";")) {
      const eq = segment.indexOf("=");
      if (eq > 0) {
        parts[segment.slice(0, eq)] = segment.slice(eq + 1);
      }
    }

    const ts = parts.ts;
    const h1 = parts.h1;

    if (!ts || !h1) {
      return false;
    }

    const signedPayload = `${ts}:${rawBody}`;
    const signatureBytes = toArrayBuffer(hexToBytes(h1));
    const payloadBytes = toArrayBuffer(encoder.encode(signedPayload));

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      payloadBytes
    );
  } catch (error) {
    console.error("Paddle webhook signature verification threw:", error);
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex signature length.");
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }

  return bytes;
}

/** Resolve a Paddle price ID to its plan label. */
export function resolvePlan(priceId: string): "monthly" | "yearly" | null {
  if (priceId === PRICE_IDS.monthly) return "monthly";
  if (priceId === PRICE_IDS.yearly) return "yearly";
  return null;
}