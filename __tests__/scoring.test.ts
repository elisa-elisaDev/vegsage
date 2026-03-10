/**
 * Unit tests for the VegSage score engine (lib/scoring.ts)
 */

import {
  computeWeeklyAvg,
  computeBreakdown,
  computeGlobalScore,
  computeScore,
  generateInsights,
  scoreStatus,
  computeNutrientCoverage,
  computeDailyNutrientSummary,
  computeDailyInsights,
} from "../lib/scoring";
import type { NutrientsPer100g } from "../lib/nutrition";

// Helper: build a day with all scored nutrients at a given multiple of target
function dayAtFraction(fraction: number): Partial<NutrientsPer100g> {
  return {
    b12: 2.4 * fraction,
    iron: 14 * fraction,
    protein: 50 * fraction,
    calcium: 1000 * fraction,
    omega3: 1.6 * fraction,
    fiber: 25 * fraction,
  };
}

describe("computeWeeklyAvg", () => {
  it("returns 0 for empty array", () => {
    const avg = computeWeeklyAvg([], 7);
    expect(avg.b12).toBe(0);
    expect(avg.protein).toBe(0);
  });

  it("averages correctly over 7 days (full target every day)", () => {
    const days = Array.from({ length: 7 }, () => dayAtFraction(1));
    const avg = computeWeeklyAvg(days, 7);
    expect(avg.b12).toBeCloseTo(2.4);
    expect(avg.iron).toBeCloseTo(14);
  });

  it("averages correctly when only 3 days provided (window = 7)", () => {
    const days = [dayAtFraction(1), dayAtFraction(1), dayAtFraction(1)];
    const avg = computeWeeklyAvg(days, 7);
    // 3 × 2.4 / 7 ≈ 1.028
    expect(avg.b12).toBeCloseTo((3 * 2.4) / 7, 3);
  });
});

describe("computeBreakdown", () => {
  it("gives 100 for each nutrient at full target", () => {
    const avg = dayAtFraction(1);
    const bd = computeBreakdown(avg);
    expect(bd.b12).toBe(100);
    expect(bd.iron).toBe(100);
    expect(bd.protein).toBe(100);
    expect(bd.calcium).toBe(100);
    expect(bd.omega3).toBe(100);
    expect(bd.fiber).toBe(100);
  });

  it("caps at 100 when exceeding target", () => {
    const avg = dayAtFraction(2);
    const bd = computeBreakdown(avg);
    expect(bd.b12).toBe(100);
  });

  it("returns 0 for b12 if b12 avg == 0", () => {
    const avg = { b12: 0, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };
    const bd = computeBreakdown(avg);
    expect(bd.b12).toBe(0);
  });

  it("computes partial score correctly (50% of target)", () => {
    const avg = dayAtFraction(0.5);
    const bd = computeBreakdown(avg);
    expect(bd.b12).toBeCloseTo(50);
    expect(bd.iron).toBeCloseTo(50);
  });
});

describe("computeGlobalScore", () => {
  it("returns 100 when all nutrients at 100%", () => {
    const bd = {
      b12: 100,
      iron: 100,
      protein: 100,
      calcium: 100,
      omega3: 100,
      fiber: 100,
    };
    expect(computeGlobalScore(bd)).toBe(100);
  });

  it("returns 0 when all nutrients at 0", () => {
    const bd = {
      b12: 0,
      iron: 0,
      protein: 0,
      calcium: 0,
      omega3: 0,
      fiber: 0,
    };
    expect(computeGlobalScore(bd)).toBe(0);
  });

  it("applies weights correctly — b12+iron+protein = 60%", () => {
    // Only b12, iron, protein at 100; rest 0
    // weights: b12:0.20, iron:0.20, protein:0.20, calcium:0.20, omega3:0.10, fiber:0.10
    const bd = {
      b12: 100,
      iron: 100,
      protein: 100,
      calcium: 0,
      omega3: 0,
      fiber: 0,
    };
    // Expected: 100*0.2 + 100*0.2 + 100*0.2 = 60
    expect(computeGlobalScore(bd)).toBeCloseTo(60);
  });
});

describe("computeScore (integration)", () => {
  it("returns global score 100 for 7 days at full targets", () => {
    const days = Array.from({ length: 7 }, () => dayAtFraction(1));
    const result = computeScore(days, 7);
    expect(result.globalScore).toBe(100);
    expect(result.breakdown.b12).toBe(100);
  });

  it("returns 0 for 7 empty days", () => {
    const days = Array.from({ length: 7 }, () => ({}));
    const result = computeScore(days, 7);
    expect(result.globalScore).toBe(0);
  });

  it("handles mixed days (some good, some empty)", () => {
    const days = [
      dayAtFraction(1),
      dayAtFraction(1),
      {},
      {},
      {},
      {},
      {},
    ];
    const result = computeScore(days, 7);
    // 2/7 of target for each nutrient → global ≈ 28.6
    expect(result.globalScore).toBeGreaterThan(0);
    expect(result.globalScore).toBeLessThan(50);
  });
});

describe("generateInsights", () => {
  it("returns no insights when all scores >= 75", () => {
    const bd = {
      b12: 80,
      iron: 90,
      protein: 75,
      calcium: 85,
      omega3: 76,
      fiber: 100,
    };
    expect(generateInsights(bd)).toHaveLength(0);
  });

  it("returns max 3 insights even if 6 nutrients are low", () => {
    const bd = {
      b12: 10,
      iron: 20,
      protein: 30,
      calcium: 40,
      omega3: 50,
      fiber: 60,
    };
    const insights = generateInsights(bd);
    expect(insights.length).toBeLessThanOrEqual(3);
  });

  it("marks severity high for score < 50", () => {
    const bd = {
      b12: 10,
      iron: 100,
      protein: 100,
      calcium: 100,
      omega3: 100,
      fiber: 100,
    };
    const insights = generateInsights(bd);
    expect(insights).toHaveLength(1);
    expect(insights[0].nutrient).toBe("b12");
    expect(insights[0].severity).toBe("high");
  });

  it("marks severity medium for 50 <= score < 75", () => {
    const bd = {
      b12: 60,
      iron: 100,
      protein: 100,
      calcium: 100,
      omega3: 100,
      fiber: 100,
    };
    const insights = generateInsights(bd);
    expect(insights).toHaveLength(1);
    expect(insights[0].severity).toBe("medium");
  });

  it("orders high severity before medium", () => {
    const bd = {
      b12: 60,   // medium
      iron: 30,  // high
      protein: 100,
      calcium: 100,
      omega3: 100,
      fiber: 100,
    };
    const insights = generateInsights(bd);
    expect(insights[0].severity).toBe("high");
    expect(insights[0].nutrient).toBe("iron");
  });
});

describe("scoreStatus", () => {
  it("returns 'On track' for > 70", () => {
    expect(scoreStatus(71)).toBe("On track");
    expect(scoreStatus(100)).toBe("On track");
  });
  it("returns 'Moderate' for 40–70", () => {
    expect(scoreStatus(40)).toBe("Moderate");
    expect(scoreStatus(70)).toBe("Moderate");
  });
  it("returns 'Needs attention' for < 40", () => {
    expect(scoreStatus(39)).toBe("Needs attention");
    expect(scoreStatus(0)).toBe("Needs attention");
  });
});

// ── New: computeNutrientCoverage ──────────────────────────────────────────────

describe("computeNutrientCoverage", () => {
  it("returns 0 when target is 0", () => {
    expect(computeNutrientCoverage(10, 0)).toBe(0);
  });

  it("returns intake/target when below 1", () => {
    expect(computeNutrientCoverage(25, 50)).toBeCloseTo(0.5);
  });

  it("returns 1 when intake equals target", () => {
    expect(computeNutrientCoverage(50, 50)).toBe(1);
  });

  it("caps at 1 when intake exceeds target", () => {
    expect(computeNutrientCoverage(200, 50)).toBe(1);
  });

  it("returns 0 for zero intake", () => {
    expect(computeNutrientCoverage(0, 50)).toBe(0);
  });
});

// ── New: computeDailyNutrientSummary ─────────────────────────────────────────

describe("computeDailyNutrientSummary", () => {
  const TARGETS = { b12: 2.4, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };

  it("returns score 100 when all nutrients meet targets", () => {
    const totals = { b12: 2.4, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };
    const result = computeDailyNutrientSummary(totals, TARGETS);
    expect(result.score).toBe(100);
  });

  it("returns score 0 when all totals are 0", () => {
    const totals = {};
    const result = computeDailyNutrientSummary(totals, TARGETS);
    expect(result.score).toBe(0);
  });

  it("computes per-nutrient coverage correctly", () => {
    const totals = { b12: 1.2, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };
    const result = computeDailyNutrientSummary(totals, TARGETS);
    expect(result.nutrients.b12.coverage).toBeCloseTo(0.5);
    expect(result.nutrients.b12.intake).toBe(1.2);
    expect(result.nutrients.b12.target).toBe(2.4);
    expect(result.nutrients.iron.coverage).toBe(1);
  });

  it("caps coverage at 1 even when exceeding target", () => {
    const totals = { b12: 100, iron: 100, protein: 100, calcium: 10000, omega3: 100, fiber: 100 };
    const result = computeDailyNutrientSummary(totals, TARGETS);
    expect(result.score).toBe(100);
    expect(result.nutrients.b12.coverage).toBe(1);
  });

  it("returns all 6 scored nutrients in the nutrients map", () => {
    const result = computeDailyNutrientSummary({}, TARGETS);
    expect(Object.keys(result.nutrients)).toEqual(
      expect.arrayContaining(["b12", "iron", "protein", "calcium", "omega3", "fiber"])
    );
  });

  it("applies weights — only b12+iron+protein at target gives ~60", () => {
    const totals = { b12: 2.4, iron: 14, protein: 50 };
    const result = computeDailyNutrientSummary(totals, TARGETS);
    // b12:0.20, iron:0.20, protein:0.20 = 60% weighted coverage
    expect(result.score).toBeCloseTo(60, 0);
  });
});

// ── New: computeDailyInsights ─────────────────────────────────────────────────

describe("computeDailyInsights", () => {
  const TARGETS = { b12: 2.4, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };

  it("returns empty array when all nutrients meet targets", () => {
    const totals = { b12: 2.4, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };
    const insights = computeDailyInsights(totals, TARGETS);
    expect(insights.filter((i) => i.severity !== "good")).toHaveLength(0);
  });

  it("marks severity 'missing' when intake is 0", () => {
    const totals = { b12: 0, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };
    const insights = computeDailyInsights(totals, TARGETS);
    const b12 = insights.find((i) => i.nutrient === "b12");
    expect(b12?.severity).toBe("missing");
  });

  it("marks severity 'low' when coverage < 50%", () => {
    const totals = { b12: 0.5, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };
    const insights = computeDailyInsights(totals, TARGETS);
    const b12 = insights.find((i) => i.nutrient === "b12");
    // 0.5/2.4 ≈ 20.8% < 50%
    expect(b12?.severity).toBe("low");
  });

  it("marks severity 'good' when coverage >= 100%", () => {
    const totals = { b12: 2.4, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };
    const insights = computeDailyInsights(totals, TARGETS);
    const b12 = insights.find((i) => i.nutrient === "b12");
    expect(b12?.severity).toBe("good");
  });

  it("produces no insight for 50–100% coverage (adequate range)", () => {
    // b12 at 60% — adequate, no insight
    const totals = { b12: 1.44, iron: 14, protein: 50, calcium: 1000, omega3: 1.6, fiber: 25 };
    const insights = computeDailyInsights(totals, TARGETS);
    const b12 = insights.find((i) => i.nutrient === "b12");
    expect(b12).toBeUndefined();
  });

  it("caps output at 3 insights", () => {
    const totals = {}; // all missing
    const insights = computeDailyInsights(totals, TARGETS);
    expect(insights.length).toBeLessThanOrEqual(3);
  });

  it("prioritises missing > low > good", () => {
    // b12 missing (0), iron low (<50%), calcium good (≥100%)
    const totals = { b12: 0, iron: 4, calcium: 1000, protein: 50, omega3: 1.6, fiber: 25 };
    const insights = computeDailyInsights(totals, TARGETS);
    expect(insights[0].severity).toBe("missing");
    expect(insights[0].nutrient).toBe("b12");
  });
});
