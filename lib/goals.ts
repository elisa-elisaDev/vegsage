/**
 * VegSage — User nutrition goals helpers.
 *
 * Goals are stored in profiles.daily_goals_json as a plain JSON object.
 * Any key absent or invalid falls back to DAILY_TARGETS from nutrition.ts.
 */

import { DAILY_TARGETS } from "./nutrition";
import type { NutrientKey, UserGoals } from "./nutrition";

// ─── Goal keys ────────────────────────────────────────────────────────────────

/** The five macro keys users can set goals for. */
export const GOAL_KEYS = ["calories", "protein", "carbs", "fat", "fiber"] as const;
export type GoalKey = typeof GOAL_KEYS[number];

/** Max sensible value per key — guards against accidental input. */
const GOAL_MAX: Record<GoalKey, number> = {
  calories: 10000,
  protein:  500,
  carbs:    1000,
  fat:      500,
  fiber:    200,
};

// ─── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parse and validate a goals object from the database.
 * Returns only valid, positive numeric values; invalid keys are omitted
 * so callers fall back to DAILY_TARGETS via resolveGoals().
 */
export function parseGoals(raw: unknown): UserGoals {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const result: UserGoals = {};
  for (const key of GOAL_KEYS) {
    const v = obj[key];
    if (typeof v === "number" && v > 0 && v <= GOAL_MAX[key]) {
      result[key as NutrientKey] = v;
    }
  }
  return result;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface GoalProgress {
  current:  number; // today's total
  target:   number; // user goal (or default)
  progress: number; // 0–1, capped at 1
}

/**
 * Compute progress for each macro goal against today's totals.
 * @param totals   — current day totals (keys may be absent → treated as 0)
 * @param resolved — goals merged with defaults (from resolveGoals())
 */
export function computeGoalProgress(
  totals:   Partial<Record<GoalKey, number>>,
  resolved: Record<string, number>
): Record<GoalKey, GoalProgress> {
  const out = {} as Record<GoalKey, GoalProgress>;
  for (const key of GOAL_KEYS) {
    const current = totals[key] ?? 0;
    const target  = resolved[key as NutrientKey] ?? DAILY_TARGETS[key as NutrientKey];
    out[key] = {
      current,
      target,
      progress: target > 0 ? Math.min(current / target, 1) : 0,
    };
  }
  return out;
}
