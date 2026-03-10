"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { GOAL_KEYS } from "@/lib/goals";
import type { GoalKey } from "@/lib/goals";

interface GoalsFormProps {
  initialGoals: Record<GoalKey, number>;
  t: Dict;
}

const FIELD_LIMITS: Record<GoalKey, { min: number; max: number; step: number }> = {
  calories: { min: 500,  max: 10000, step: 50 },
  protein:  { min: 10,   max: 500,   step: 1  },
  carbs:    { min: 10,   max: 1000,  step: 5  },
  fat:      { min: 5,    max: 500,   step: 1  },
  fiber:    { min: 5,    max: 200,   step: 1  },
};

export function GoalsForm({ initialGoals, t }: GoalsFormProps) {
  const [values, setValues] = useState<Record<GoalKey, number>>(initialGoals);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: GoalKey, raw: string) {
    const n = Number(raw);
    if (!isNaN(n) && n > 0) {
      setValues((prev) => ({ ...prev, [key]: n }));
      setSaved(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/user/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error saving goals.");
      } else {
        setSaved(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {GOAL_KEYS.map((key) => {
          const limits = FIELD_LIMITS[key];
          const label = (t.nutrients as Record<string, string>)[key] ?? key;
          const unit  = key === "calories" ? t.nutrients.kcal : t.nutrients.g;
          return (
            <div key={key} className={key === "calories" ? "col-span-2" : ""}>
              <label
                htmlFor={`goal-${key}`}
                className="block text-xs text-gray-500 mb-1"
              >
                {label}
                <span className="text-gray-400 ml-1">({unit})</span>
              </label>
              <input
                id={`goal-${key}`}
                type="number"
                min={limits.min}
                max={limits.max}
                step={limits.step}
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
      >
        {saving ? "…" : saved ? t.settings.goalsSaved : t.settings.goalsSaveBtn}
      </button>
    </form>
  );
}
