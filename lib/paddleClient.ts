declare global {
  interface Window {
    Paddle?: {
      Initialize: (opts: {
        token: string;
        pwCustomer?: { email: string };
        eventCallback?: (data: { name: string }) => void;
      }) => void;
      Checkout: {
        open: (opts: {
          items: { priceId: string; quantity: number }[];
          customer?: { email: string };
          customData?: Record<string, string>;
        }) => void;
      };
    };
  }
}

const PRICE_IDS = {
  monthly: "pri_01kjvxwzppnmmvz44qk306hk22",
  yearly: "pri_01kjvy0jc2pmeh57v8ympzcjyk",
} as const;

function loadPaddleScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById("paddle-js")) return resolve();
    const script = document.createElement("script");
    script.id = "paddle-js";
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export async function openPaddleCheckout(plan: "monthly" | "yearly", email?: string, userId?: string) {
  if (!window.Paddle) {
    await loadPaddleScript();
    window.Paddle!.Initialize({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
      ...(email ? { pwCustomer: { email } } : {}),
      eventCallback(data) {
        if (data.name === "checkout.completed") {
          window.location.href = "/settings?upgraded=1";
        }
      },
    });
  }
  window.Paddle!.Checkout.open({
    items: [{ priceId: PRICE_IDS[plan], quantity: 1 }],
    ...(email ? { customer: { email } } : {}),
    ...(userId ? { customData: { userId } } : {}),
  });
}
