"use client";

import { NUTRIENT_LABELS } from "@/lib/nutrition";
import type { NutrientKey } from "@/lib/nutrition";
import type { Dict } from "@/lib/i18n";

interface InsightCardProps {
  id: string;
  nutrient: NutrientKey;
  severity: "high" | "medium";
  message: string;
  t: Dict;
  onDismiss?: (id: string) => void;
}

const SEVERITY_STYLES = {
  high: {
    border: "border-red-200 bg-red-50",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-400",
  },
  medium: {
    border: "border-yellow-200 bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-400",
  },
};

export function InsightCard({ id, nutrient, severity, message, t, onDismiss }: InsightCardProps) {
  const styles = SEVERITY_STYLES[severity];

  return (
    <div className={`rounded-xl border p-4 flex gap-3 ${styles.border}`} role="alert">
      <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${styles.dot}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
            {NUTRIENT_LABELS[nutrient]}
          </span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(id)}
          aria-label={t.common.dismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
