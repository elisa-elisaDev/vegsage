declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (environment: "sandbox" | "production") => void;
      };
      Initialize: (opts: {
        token: string;
        eventCallback?: (data: { name: string }) => void;
      }) => void;
      Checkout: {
        open: (opts: {
          items: { priceId: string; quantity: number }[];
          customer?: { email: string };
          customData?: Record<string, string>;
          settings?: {
            successUrl?: string;
          };
        }) => void;
      };
    };
  }
}

const PADDLE_ENV = process.env.NEXT_PUBLIC_PADDLE_ENV;
const PADDLE_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
const PRICE_IDS = {
  monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY,
  yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY,
} as const;

function getRequiredEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required Paddle environment variable: ${name}`);
  }
  return value;
}

function validatePaddleEnv(environment: string | undefined): "production" | "sandbox" {
  if (environment === "production" || environment === "sandbox") {
    return environment;
  }

  throw new Error(
    "Invalid NEXT_PUBLIC_PADDLE_ENV value. Expected 'production' or 'sandbox'."
  );
}

function loadPaddleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("paddle-js")) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "paddle-js";
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paddle.js"));
    document.head.appendChild(script);
  });
}

export async function openPaddleCheckout(
  plan: "monthly" | "yearly",
  email?: string,
  userId?: string
) {
  const environment = validatePaddleEnv(PADDLE_ENV);
  const token = getRequiredEnv(
    PADDLE_TOKEN,
    "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"
  );
  const priceId = getRequiredEnv(
    PRICE_IDS[plan],
    `NEXT_PUBLIC_PADDLE_PRICE_${plan.toUpperCase()}`
  );

  if (!window.Paddle) {
    await loadPaddleScript();
  }

  if (!window.Paddle) {
    throw new Error("Paddle failed to initialize.");
  }

  console.log("[Paddle Debug] plan:", plan);
  console.log("[Paddle Debug] environment:", environment);
  console.log("[Paddle Debug] token:", token);
  console.log("[Paddle Debug] priceId:", priceId);
  console.log("[Paddle Debug] email:", email ?? null);
  console.log("[Paddle Debug] userId:", userId ?? null);
  console.log(
    "[Paddle Debug] paddle script:",
    document.querySelector('script[src*="paddle"]')?.getAttribute("src")
  );

  window.Paddle.Environment.set(environment);

  window.Paddle.Initialize({
    token,
    eventCallback(data) {
      console.log("[Paddle Debug] event:", data.name);

      if (data.name === "checkout.completed") {
        window.location.href = "/settings?upgraded=1";
      }
    },
  });

  const checkoutOptions = {
    items: [{ priceId, quantity: 1 }],
    ...(email ? { customer: { email } } : {}),
    ...(userId ? { customData: { userId } } : {}),
  };

  console.log("[Paddle Debug] checkoutOptions:", checkoutOptions);

  window.Paddle.Checkout.open(checkoutOptions);
}