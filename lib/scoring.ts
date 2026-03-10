/**
 * VegSage Score Engine
 * Calculates the "Vegetarian Confidence Score" from a 7-day rolling average.
 * Server-side only (called after meal_item mutations).
 */

import type { NutrientsPer100g, NutrientKey } from "./nutrition";
import { DAILY_TARGETS } from "./nutrition";

// Scoring weights (must sum to 1.0)
// v2: fiber replaces zinc; calcium raised to 0.20; omega3 lowered to 0.10
const WEIGHTS: Record<string, number> = {
  b12:     0.20,
  iron:    0.20,
  protein: 0.20,
  calcium: 0.20,
  omega3:  0.10,
  fiber:   0.10,
};

// Scored nutrients (excludes macros and calories)
export const SCORED_NUTRIENTS: NutrientKey[] = [
  "b12", "iron", "protein", "calcium", "omega3", "fiber",
];

export type DailyTotals = NutrientsPer100g; // same shape, accumulated

export interface ScoreBreakdown {
  b12:     number; // 0–100
  iron:    number;
  protein: number;
  calcium: number;
  omega3:  number;
  fiber:   number;
  [key: string]: number; // index signature for dynamic access
}

// ─── Daily structured output ─────────────────────────────────────────────────

export interface NutrientCoverage {
  intake:   number; // actual daily intake
  target:   number; // goal / default target
  coverage: number; // 0–1, capped at 1
}

export interface DailyNutrientSummary {
  score:     number; // 0–100 weighted coverage score
  nutrients: Record<typeof SCORED_NUTRIENTS[number], NutrientCoverage>;
}

/**
 * Compute coverage for a single nutrient: intake / target, clamped 0–1.
 */
export function computeNutrientCoverage(intake: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(intake / target, 1);
}

/**
 * Compute the structured daily nutrient summary (score + per-nutrient coverage).
 * Uses today's totals from daily_summaries.totals_json — no extra DB queries.
 *
 * @param totals   totals_json from daily_summaries (or fallback client totals)
 * @param targets  resolved user goals merged with DAILY_TARGETS
 */
export function computeDailyNutrientSummary(
  totals:  Record<string, number>,
  targets: Record<string, number>
): DailyNutrientSummary {
  const nutrients = {} as Record<string, NutrientCoverage>;
  let weightedSum = 0;

  for (const key of SCORED_NUTRIENTS) {
    const intake   = totals[key]   ?? 0;
    const target   = targets[key]  ?? DAILY_TARGETS[key as NutrientKey] ?? 1;
    const coverage = computeNutrientCoverage(intake, target);
    nutrients[key] = { intake, target, coverage };
    weightedSum   += coverage * (WEIGHTS[key] ?? 0);
  }

  return {
    score:     Math.round(weightedSum * 1000) / 10, // e.g. 78.4
    nutrients: nutrients as Record<typeof SCORED_NUTRIENTS[number], NutrientCoverage>,
  };
}

// ─── Daily insights ───────────────────────────────────────────────────────────

export interface DailyInsight {
  nutrient: NutrientKey;
  severity: "missing" | "low" | "good";
}

/**
 * Generate "today" insight flags (max 3) from daily totals.
 * Returns "missing" for zero intake, "low" for <50% coverage, "good" for ≥100%.
 * Only actionable states are returned; adequate (50–100%) are silent.
 */
export function computeDailyInsights(
  totals:  Record<string, number>,
  targets: Record<string, number>
): DailyInsight[] {
  const results: DailyInsight[] = [];

  for (const key of SCORED_NUTRIENTS) {
    const intake   = totals[key]   ?? 0;
    const target   = targets[key]  ?? DAILY_TARGETS[key as NutrientKey] ?? 1;
    const coverage = computeNutrientCoverage(intake, target);

    if (intake === 0) {
      results.push({ nutrient: key as NutrientKey, severity: "missing" });
    } else if (coverage >= 1) {
      results.push({ nutrient: key as NutrientKey, severity: "good" });
    } else if (coverage < 0.5) {
      results.push({ nutrient: key as NutrientKey, severity: "low" });
    }
    // 50–100% coverage: no insight (adequate, not alarming)
  }

  // Priority: missing > low > good; cap at 3
  const priority = { missing: 0, low: 1, good: 2 };
  results.sort((a, b) => priority[a.severity] - priority[b.severity]);
  return results.slice(0, 3);
}

export interface ScoreResult {
  globalScore: number;       // 0–100
  breakdown: ScoreBreakdown;
  weeklyAvg: Partial<NutrientsPer100g>;
}

export interface InsightOutput {
  nutrient: NutrientKey;
  severity: "high" | "medium";
  message: string;
}

const INSIGHT_MESSAGES: Partial<Record<NutrientKey, string>> = {
  b12:     "Your B12 looks low. Consider fortified foods, and if needed discuss supplementation with a professional.",
  iron:    "Iron intake seems low. Add lentils/beans, and pair iron-rich foods with vitamin C.",
  protein: "Protein is a bit low. Add legumes, tofu/tempeh, dairy or eggs depending on your diet.",
  calcium: "Calcium looks low. Consider fortified plant milks, dairy, tofu set with calcium, or calcium-rich greens.",
  omega3:  "Omega-3 is low. Add chia, flax, walnuts, or algae-based options.",
  fiber:   "Fiber is low. Add vegetables, legumes, whole grains, and fruits.",
};

type NutrientRecord = Partial<Record<NutrientKey, number>>;

/**
 * Compute the 7-day rolling average for each nutrient.
 * Accepts up to 7 daily total objects. Missing days count as 0.
 */
export function computeWeeklyAvg(
  dailyTotals: Array<Partial<NutrientsPer100g>>,
  windowDays = 7
): Partial<NutrientsPer100g> {
  const avg: NutrientRecord = {};
  for (const key of SCORED_NUTRIENTS) {
    const sum = dailyTotals.reduce((acc, day) => {
      const v = day[key];
      return acc + (typeof v === "number" ? v : 0);
    }, 0);
    avg[key] = sum / windowDays;
  }
  return avg;
}

/**
 * Compute per-nutrient score (0–100) from weekly average.
 * Special rule: if b12 weekly avg == 0, score = 0.
 */
export function computeBreakdown(
  weeklyAvg: Partial<NutrientsPer100g>
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    b12: 0, iron: 0, protein: 0, calcium: 0, omega3: 0, fiber: 0,
  };
  for (const key of SCORED_NUTRIENTS) {
    const avg = (weeklyAvg as NutrientRecord)[key] ?? 0;
    const target = DAILY_TARGETS[key as keyof typeof DAILY_TARGETS];
    let score: number;
    if (key === "b12" && avg === 0) {
      score = 0;
    } else {
      score = Math.min(avg / target, 1) * 100;
    }
    breakdown[key] = Math.round(score * 10) / 10;
  }
  return breakdown;
}

/**
 * Compute global weighted score.
 */
export function computeGlobalScore(breakdown: ScoreBreakdown): number {
  let total = 0;
  for (const key of SCORED_NUTRIENTS) {
    const weight = WEIGHTS[key] ?? 0;
    total += breakdown[key] * weight;
  }
  return Math.round(total * 10) / 10;
}

/**
 * Full score computation from 7-day daily totals.
 */
export function computeScore(
  dailyTotals: Array<Partial<NutrientsPer100g>>,
  windowDays = 7
): ScoreResult {
  const weeklyAvg = computeWeeklyAvg(dailyTotals, windowDays);
  const breakdown = computeBreakdown(weeklyAvg);
  const globalScore = computeGlobalScore(breakdown);
  return { globalScore, breakdown, weeklyAvg };
}

/**
 * Generate insights for nutrients with score < 75.
 * Returns max 3, ordered by severity (high first).
 */
export function generateInsights(breakdown: ScoreBreakdown): InsightOutput[] {
  const candidates: InsightOutput[] = [];

  for (const key of SCORED_NUTRIENTS) {
    const score = breakdown[key];
    if (score >= 75) continue;
    const severity: "high" | "medium" = score < 50 ? "high" : "medium";
    const message = INSIGHT_MESSAGES[key as NutrientKey];
    if (!message) continue;
    candidates.push({ nutrient: key as NutrientKey, severity, message });
  }

  // Sort: high severity first
  candidates.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "high" ? -1 : 1;
  });

  return candidates.slice(0, 3);
}

// ── Score display mode ──────────────────────────────────────────────────────

/** How the ScoreCard should render based on data quality/quantity */
export type ScoreMode = "building" | "insufficient" | "ready";

/**
 * Determine ScoreCard display mode:
 * - "building"    : fewer than 2 logs → ask user to add more meals
 * - "insufficient": <3 nutrients have any data → warn about OFF data gaps
 * - "ready"       : show adjusted score + diagnostic
 */
export function getScoreMode(
  logCount: number,
  breakdown: ScoreBreakdown,
  totals: Record<string, number>
): ScoreMode {
  if (logCount < 2) return "building";
  const validCount = SCORED_NUTRIENTS.filter((k) => (totals[k] ?? 0) > 0).length;
  if (validCount < 3) return "insufficient";
  return "ready";
}

/**
 * Recalculate score ignoring nutrients absent from totals (OFF data gaps).
 * Reweights proportionally so the result stays in 0–100.
 */
export function computeAdjustedScore(
  breakdown: ScoreBreakdown,
  totals: Record<string, number>
): { score: number; validNutrients: NutrientKey[] } {
  const validNutrients = SCORED_NUTRIENTS.filter((k) => (totals[k] ?? 0) > 0);
  if (validNutrients.length === 0) return { score: 0, validNutrients: [] };
  const totalWeight = validNutrients.reduce((sum, k) => sum + (WEIGHTS[k] ?? 0), 0);
  let score = 0;
  for (const k of validNutrients) {
    score += (breakdown[k] ?? 0) * ((WEIGHTS[k] ?? 0) / totalWeight);
  }
  return { score: Math.round(score * 10) / 10, validNutrients };
}

/**
 * Return up to `maxFoods` food suggestions for the worst-scoring nutrients.
 * Accepts localized suggestion arrays keyed by nutrient.
 */
export function getFoodSuggestions(
  breakdown: ScoreBreakdown,
  suggestionsByNutrient: Partial<Record<NutrientKey, string[]>>,
  maxFoods = 3
): string[] {
  // Worst 2 nutrients (score < 75), ascending by score
  const worst2 = [...SCORED_NUTRIENTS]
    .filter((k) => (breakdown[k] ?? 100) < 75)
    .sort((a, b) => (breakdown[a] ?? 0) - (breakdown[b] ?? 0))
    .slice(0, 2);

  const foods: string[] = [];
  for (const nutrient of worst2) {
    for (const food of suggestionsByNutrient[nutrient] ?? []) {
      if (foods.length < maxFoods && !foods.includes(food)) foods.push(food);
    }
  }
  return foods;
}

/** Score status label for UI */
export function scoreStatus(score: number): "On track" | "Moderate" | "Needs attention" {
  if (score > 70) return "On track";
  if (score >= 40) return "Moderate";
  return "Needs attention";
}

/** Score status color class */
export function scoreColor(score: number): string {
  if (score > 70) return "text-green-600";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
}
