"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { openPaddleCheckout } from "@/lib/paddleClient";

export function PricingClient({ t, userEmail }: { t: Dict; userEmail?: string }) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(plan: "monthly" | "yearly") {
    setLoading(plan);
    setError(null);
    try {
      await openPaddleCheckout(plan, userEmail);
    } catch {
      setError(t.errors.network);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Features list */}
      <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Premium</p>
        <ul className="flex flex-col gap-2">
          {t.pricing.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-brand-500">✓</span> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Monthly */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
          <p className="font-semibold text-gray-900">{t.pricing.monthlyLabel}</p>
          <p className="text-3xl font-bold text-gray-900">
            {t.pricing.monthlyPrice}
            <span className="text-sm font-normal text-gray-400 ml-1">{t.pricing.perMonth}</span>
          </p>
          <button
            onClick={() => handleUpgrade("monthly")}
            disabled={loading !== null}
            className="mt-auto rounded-xl border border-brand-600 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60 transition-colors"
          >
            {loading === "monthly" ? t.pricing.processingBtn : t.pricing.upgradeBtn}
          </button>
        </div>

        {/* Yearly */}
        <div className="bg-white rounded-2xl border-2 border-brand-500 p-5 flex flex-col gap-3 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {t.pricing.mostPopular}
          </span>
          <p className="font-semibold text-gray-900">{t.pricing.yearlyLabel}</p>
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {t.pricing.yearlyPrice}
              <span className="text-sm font-normal text-gray-400 ml-1">{t.pricing.perYear}</span>
            </p>
            <p className="text-xs text-green-600 font-medium mt-0.5">{t.pricing.savePercent}</p>
          </div>
          <button
            onClick={() => handleUpgrade("yearly")}
            disabled={loading !== null}
            className="mt-auto rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {loading === "yearly" ? t.pricing.processingBtn : t.pricing.upgradeBtn}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      <p className="text-xs text-gray-400 text-center">{t.pricing.paddleNote}</p>
    </div>
  );
}
