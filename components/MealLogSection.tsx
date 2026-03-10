"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dict } from "@/lib/i18n";
import type { GroupedMeals, MealType, MealLogItem } from "@/lib/mealGrouping";
import { MEAL_TYPES } from "@/lib/mealGrouping";

interface MealLogSectionProps {
  initialGroups: GroupedMeals;
  t: Dict;
}

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "☀️",
  lunch:     "🌿",
  dinner:    "🌙",
  snack:     "🍎",
};

const MEAL_LABEL_KEYS: Record<MealType, keyof Dict["addFood"]> = {
  breakfast: "mealBreakfast",
  lunch:     "mealLunch",
  dinner:    "mealDinner",
  snack:     "mealSnack",
};

export function MealLogSection({ initialGroups, t }: MealLogSectionProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupedMeals>(initialGroups);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleDelete(item: MealLogItem) {
    // Optimistic remove
    setDeletingId(item.id);
    setGroups((prev) => ({
      ...prev,
      [item.meal_type]: prev[item.meal_type].filter((i) => i.id !== item.id),
    }));

    try {
      await fetch(`/api/food/log/${item.id}`, { method: "DELETE" });
    } finally {
      setDeletingId(null);
      // Refresh server component so totals + goal progress update
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {MEAL_TYPES.map((meal) => {
        const items  = groups[meal];
        const label  = t.addFood[MEAL_LABEL_KEYS[meal]] as string;
        const icon   = MEAL_ICONS[meal];

        return (
          <div key={meal} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Meal header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
              <span className="text-sm font-semibold text-gray-700">
                {icon} {label}
              </span>
              <a
                href={`/add?meal=${meal}`}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                + {t.nav.addFood}
              </a>
            </div>

            {/* Food items */}
            {items.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-300">—</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.quantity_g}g
                        {" · "}
                        {Math.round(item.calories_kcal)} {t.nutrients.kcal}
                        {item.protein != null && ` · ${item.protein.toFixed(1)}g P`}
                        {item.carbs   != null && ` · ${item.carbs.toFixed(1)}g C`}
                        {item.fat     != null && ` · ${item.fat.toFixed(1)}g F`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      aria-label={t.dashboard.deleteEntry}
                      className="flex-shrink-0 text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors text-base leading-none"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
