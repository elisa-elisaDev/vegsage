"use client";

import { NUTRIENT_LABELS, NUTRIENT_UNITS, DAILY_TARGETS, formatNutrient } from "@/lib/nutrition";
import type { NutrientKey } from "@/lib/nutrition";
import type { Dict } from "@/lib/i18n";

interface NutrientBarProps {
  nutrient: NutrientKey;
  value: number; // today's total
  score: number; // 0–100 from weekly avg
  t: Dict;
}

const BAR_COLORS = {
  high: "bg-green-500",
  medium: "bg-yellow-400",
  low: "bg-red-400",
};

export function NutrientBar({ nutrient, value, score }: NutrientBarProps) {
  if (nutrient === "calories") return null;

  const label = NUTRIENT_LABELS[nutrient];
  const unit = NUTRIENT_UNITS[nutrient];
  const target = DAILY_TARGETS[nutrient];
  const pct = Math.min((value / target) * 100, 100);

  const color =
    score >= 75 ? BAR_COLORS.high : score >= 50 ? BAR_COLORS.medium : BAR_COLORS.low;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {formatNutrient(value, nutrient)} / {target}
          {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
