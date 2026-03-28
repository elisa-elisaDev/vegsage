"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { openPaddleCheckout } from "@/lib/paddleClient";

interface PaywallProps {
  feature: string;
  features?: string[];
  t: Dict;
  userEmail?: string;
  userId?: string;
}

export function Paywall({
  feature,
  features,
  t,
  userEmail,
  userId,
}: PaywallProps) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(plan: "monthly" | "yearly") {
    if (!userEmail || !userId) {
      setError(t.errors.network);
      return;
    }

    setLoading(plan);
    setError(null);

    try {
      await openPaddleCheckout(plan, userEmail, userId);
    } catch (error: unknown) {
      console.error("Paddle checkout error:", error);
      setError(t.errors.network);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 flex flex-col items-center gap-4 text-center">
      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-2xl">
        🌱
      </div>

      <div className="w-full text-left">
        <p className="font-semibold text-gray-900 text-center">{feature}</p>

        {features && features.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1.5">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <span className="text-brand-500 font-bold flex-shrink-0">•</span>
                {f}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 mt-1 text-center">
            {t.pricing.subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          onClick={() => handleUpgrade("monthly")}
          disabled={loading !== null}
          className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {loading === "monthly"
            ? t.pricing.processingBtn
            : `${t.pricing.monthlyLabel} — ${t.pricing.monthlyPrice}${t.pricing.perMonth}`}
        </button>

        <button
          onClick={() => handleUpgrade("yearly")}
          disabled={loading !== null}
          className="flex-1 rounded-xl border border-brand-600 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60 transition-colors"
        >
          {loading === "yearly"
            ? t.pricing.processingBtn
            : `${t.pricing.yearlyLabel} — ${t.pricing.yearlyPrice}${t.pricing.perYear}`}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 w-full">
          {error}
        </p>
      )}

      <p className="text-xs text-gray-400">{t.pricing.paddleNote}</p>
    </div>
  );
}