"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Invisible client component.
 * When rendered with isPremium=false after a checkout redirect (?upgraded=1),
 * it auto-calls router.refresh() every 3 s so the server re-fetches the profile
 * and reflects the webhook-updated is_premium without manual user reload.
 * Stops once isPremium becomes true or after maxAttempts retries.
 */
export function PremiumRefresher({ isPremium }: { isPremium: boolean }) {
  const router = useRouter();
  const attempts = useRef(0);
  const maxAttempts = 4; // 3 s × 4 = 12 s total

  useEffect(() => {
    if (isPremium) return;

    const timer = setInterval(() => {
      if (attempts.current >= maxAttempts) {
        clearInterval(timer);
        return;
      }
      attempts.current++;
      console.info("[premium] refreshing to pick up webhook update, attempt", attempts.current);
      router.refresh();
    }, 3000);

    return () => clearInterval(timer);
  }, [isPremium, router]);

  return null;
}
