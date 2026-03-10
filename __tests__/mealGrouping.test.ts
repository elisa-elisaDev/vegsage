import {
  groupLogsByMeal,
  emptyGroupedMeals,
  MEAL_TYPES,
} from "../lib/mealGrouping";
import type { RawFoodLog } from "../lib/mealGrouping";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeLog(overrides: Partial<RawFoodLog> = {}): RawFoodLog {
  return {
    id:            overrides.id            ?? "uuid-1",
    product_name:  overrides.product_name  ?? "Lentils",
    brand:         overrides.brand         ?? null,
    meal_type:     overrides.meal_type     ?? "lunch",
    quantity_g:    overrides.quantity_g    ?? 100,
    calories_kcal: overrides.calories_kcal ?? 116,
    logged_at:     overrides.logged_at     ?? "2026-03-07T12:00:00Z",
    nutrients_json: overrides.nutrients_json ?? {
      per100g: { protein: 9.0, carbs: 20.1, fat: 0.38, fiber: 7.9 },
    },
  };
}

// ─── emptyGroupedMeals ────────────────────────────────────────────────────────

describe("emptyGroupedMeals", () => {
  it("returns all four meal types as empty arrays", () => {
    const g = emptyGroupedMeals();
    for (const m of MEAL_TYPES) {
      expect(g[m]).toEqual([]);
    }
  });
});

// ─── groupLogsByMeal ──────────────────────────────────────────────────────────

describe("groupLogsByMeal", () => {
  it("returns empty groups for empty input", () => {
    const g = groupLogsByMeal([]);
    for (const m of MEAL_TYPES) {
      expect(g[m]).toHaveLength(0);
    }
  });

  it("places a log in the correct meal group", () => {
    const g = groupLogsByMeal([makeLog({ meal_type: "breakfast" })]);
    expect(g.breakfast).toHaveLength(1);
    expect(g.lunch).toHaveLength(0);
    expect(g.dinner).toHaveLength(0);
    expect(g.snack).toHaveLength(0);
  });

  it("handles all four meal types", () => {
    const logs = MEAL_TYPES.map((m, i) =>
      makeLog({ id: `uuid-${i}`, meal_type: m })
    );
    const g = groupLogsByMeal(logs);
    for (const m of MEAL_TYPES) {
      expect(g[m]).toHaveLength(1);
    }
  });

  it("scales macros by quantity_g / 100", () => {
    const log = makeLog({
      quantity_g: 200,
      nutrients_json: { per100g: { protein: 10, carbs: 20, fat: 5, fiber: 8 } },
    });
    const g = groupLogsByMeal([log]);
    const item = g.lunch[0];
    expect(item.protein).toBeCloseTo(20);  // 10 * 2
    expect(item.carbs).toBeCloseTo(40);    // 20 * 2
    expect(item.fat).toBeCloseTo(10);      // 5 * 2
    expect(item.fiber).toBeCloseTo(16);    // 8 * 2
  });

  it("returns null macros when per100g key is missing", () => {
    const log = makeLog({ nutrients_json: { per100g: {} } });
    const g = groupLogsByMeal([log]);
    expect(g.lunch[0].protein).toBeNull();
    expect(g.lunch[0].carbs).toBeNull();
  });

  it("returns null macros when nutrients_json is null", () => {
    // Build directly to avoid the ?? fallback in makeLog
    const log: RawFoodLog = {
      id: "x", product_name: "Test", brand: null,
      meal_type: "lunch", quantity_g: 100, calories_kcal: 0,
      logged_at: "2026-03-07T12:00:00Z",
      nutrients_json: null,
    };
    const g = groupLogsByMeal([log]);
    expect(g.lunch[0].protein).toBeNull();
  });

  it("falls back to 'lunch' for unknown meal_type", () => {
    const log = makeLog({ meal_type: "elevenses" });
    const g = groupLogsByMeal([log]);
    expect(g.lunch).toHaveLength(1);
  });

  it("falls back to 'lunch' for null meal_type", () => {
    const log = makeLog({ meal_type: null });
    const g = groupLogsByMeal([log]);
    expect(g.lunch).toHaveLength(1);
  });

  it("preserves insertion order within a meal", () => {
    const logs = [
      makeLog({ id: "a", meal_type: "dinner", logged_at: "2026-03-07T18:00:00Z" }),
      makeLog({ id: "b", meal_type: "dinner", logged_at: "2026-03-07T18:30:00Z" }),
      makeLog({ id: "c", meal_type: "dinner", logged_at: "2026-03-07T19:00:00Z" }),
    ];
    const g = groupLogsByMeal(logs);
    expect(g.dinner.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("handles multiple logs per meal correctly", () => {
    const logs = [
      makeLog({ id: "a", meal_type: "lunch", calories_kcal: 100 }),
      makeLog({ id: "b", meal_type: "lunch", calories_kcal: 200 }),
      makeLog({ id: "c", meal_type: "snack", calories_kcal: 50 }),
    ];
    const g = groupLogsByMeal(logs);
    expect(g.lunch).toHaveLength(2);
    expect(g.snack).toHaveLength(1);
    expect(g.lunch[0].calories_kcal).toBe(100);
    expect(g.lunch[1].calories_kcal).toBe(200);
  });

  it("copies product_name, brand, id, quantity_g, calories_kcal, logged_at", () => {
    const log = makeLog({
      id: "test-id",
      product_name: "Tofu",
      brand: "Clearspring",
      quantity_g: 150,
      calories_kcal: 180,
      logged_at: "2026-03-07T13:00:00Z",
      meal_type: "lunch",
    });
    const item = groupLogsByMeal([log]).lunch[0];
    expect(item.id).toBe("test-id");
    expect(item.product_name).toBe("Tofu");
    expect(item.brand).toBe("Clearspring");
    expect(item.quantity_g).toBe(150);
    expect(item.calories_kcal).toBe(180);
    expect(item.logged_at).toBe("2026-03-07T13:00:00Z");
  });
});
