import { parseGoals, computeGoalProgress, GOAL_KEYS } from "../lib/goals";
import { resolveGoals, DAILY_TARGETS } from "../lib/nutrition";

// ─── parseGoals ───────────────────────────────────────────────────────────────

describe("parseGoals", () => {
  it("returns empty object for null", () => {
    expect(parseGoals(null)).toEqual({});
  });

  it("returns empty object for non-object", () => {
    expect(parseGoals("string")).toEqual({});
    expect(parseGoals(42)).toEqual({});
    expect(parseGoals([])).toEqual({});
  });

  it("returns empty object for empty object", () => {
    expect(parseGoals({})).toEqual({});
  });

  it("parses valid goal keys", () => {
    const result = parseGoals({ calories: 2200, protein: 110 });
    expect(result.calories).toBe(2200);
    expect(result.protein).toBe(110);
  });

  it("omits zero and negative values", () => {
    const result = parseGoals({ calories: 0, protein: -10, carbs: 250 });
    expect(result.calories).toBeUndefined();
    expect(result.protein).toBeUndefined();
    expect(result.carbs).toBe(250);
  });

  it("omits values exceeding max", () => {
    // calories max is 10000
    const result = parseGoals({ calories: 99999, protein: 100 });
    expect(result.calories).toBeUndefined();
    expect(result.protein).toBe(100);
  });

  it("ignores unknown keys", () => {
    const result = parseGoals({ calories: 2000, unknownKey: 999 });
    expect(result.calories).toBe(2000);
    expect((result as Record<string, unknown>).unknownKey).toBeUndefined();
  });

  it("handles all five macro keys", () => {
    const input = { calories: 2000, protein: 80, carbs: 250, fat: 65, fiber: 28 };
    const result = parseGoals(input);
    expect(result.calories).toBe(2000);
    expect(result.protein).toBe(80);
    expect(result.carbs).toBe(250);
    expect(result.fat).toBe(65);
    expect(result.fiber).toBe(28);
  });
});

// ─── resolveGoals (integration with defaults) ─────────────────────────────────

describe("resolveGoals", () => {
  it("returns DAILY_TARGETS when goals are null", () => {
    const resolved = resolveGoals(null);
    expect(resolved.calories).toBe(DAILY_TARGETS.calories);
    expect(resolved.protein).toBe(DAILY_TARGETS.protein);
    expect(resolved.fat).toBe(DAILY_TARGETS.fat);
    expect(resolved.carbs).toBe(DAILY_TARGETS.carbs);
    expect(resolved.fiber).toBe(DAILY_TARGETS.fiber);
  });

  it("overrides only provided keys", () => {
    const resolved = resolveGoals({ calories: 2500, protein: 120 });
    expect(resolved.calories).toBe(2500);
    expect(resolved.protein).toBe(120);
    // Unset keys fall back to defaults
    expect(resolved.fat).toBe(DAILY_TARGETS.fat);
    expect(resolved.carbs).toBe(DAILY_TARGETS.carbs);
    expect(resolved.fiber).toBe(DAILY_TARGETS.fiber);
  });

  it("returns defaults when empty goals passed", () => {
    const resolved = resolveGoals({});
    for (const key of GOAL_KEYS) {
      expect(resolved[key]).toBe(DAILY_TARGETS[key]);
    }
  });
});

// ─── computeGoalProgress ─────────────────────────────────────────────────────

describe("computeGoalProgress", () => {
  const defaultResolved = resolveGoals(null);

  it("returns zero progress when totals are empty", () => {
    const progress = computeGoalProgress({}, defaultResolved);
    for (const key of GOAL_KEYS) {
      expect(progress[key].current).toBe(0);
      expect(progress[key].progress).toBe(0);
    }
  });

  it("computes correct progress fraction", () => {
    const resolved = resolveGoals({ calories: 2000, protein: 100 });
    const progress = computeGoalProgress({ calories: 1000, protein: 50 }, resolved);
    expect(progress.calories.progress).toBeCloseTo(0.5);
    expect(progress.protein.progress).toBeCloseTo(0.5);
  });

  it("caps progress at 1.0 when exceeding target", () => {
    const resolved = resolveGoals({ calories: 2000 });
    const progress = computeGoalProgress({ calories: 3000 }, resolved);
    expect(progress.calories.progress).toBe(1);
  });

  it("exposes current, target, progress for all keys", () => {
    const totals   = { calories: 1500, protein: 60, carbs: 200, fat: 50, fiber: 20 };
    const resolved = resolveGoals({ calories: 2000, protein: 80, carbs: 260, fat: 70, fiber: 25 });
    const progress = computeGoalProgress(totals, resolved);

    expect(progress.calories.current).toBe(1500);
    expect(progress.calories.target).toBe(2000);
    expect(progress.protein.current).toBe(60);
    expect(progress.fiber.target).toBe(25);
    expect(progress.fat.progress).toBeCloseTo(50 / 70);
  });

  it("uses DAILY_TARGETS as target when resolvedGoals uses defaults", () => {
    const progress = computeGoalProgress({ calories: 800 }, defaultResolved);
    expect(progress.calories.target).toBe(DAILY_TARGETS.calories);
    expect(progress.calories.current).toBe(800);
  });
});
