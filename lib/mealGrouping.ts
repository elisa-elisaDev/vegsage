/**
 * VegSage — Meal grouping helpers.
 * Pure functions — no I/O, fully testable.
 */

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = typeof MEAL_TYPES[number];

/** A single food log item ready for display (macros already scaled). */
export interface MealLogItem {
  id:           string;
  product_name: string;
  brand:        string | null;
  meal_type:    MealType;
  quantity_g:   number;
  calories_kcal: number;
  logged_at:    string;
  // Macros scaled to quantity_g
  protein:  number | null;
  carbs:    number | null;
  fat:      number | null;
  fiber:    number | null;
}

export type GroupedMeals = Record<MealType, MealLogItem[]>;

/** Raw food_log row shape returned by Supabase. */
export interface RawFoodLog {
  id:            string;
  product_name:  string;
  brand?:        string | null;
  meal_type?:    string | null;
  quantity_g:    number;
  calories_kcal: number;
  logged_at:     string;
  nutrients_json?: { per100g?: Record<string, number | null> } | null;
}

/** Returns an empty grouped structure (all arrays empty). */
export function emptyGroupedMeals(): GroupedMeals {
  return { breakfast: [], lunch: [], dinner: [], snack: [] };
}

/** Coerce a raw meal_type string to a valid MealType, falling back to "lunch". */
function toMealType(raw: string | null | undefined): MealType {
  if (raw === "breakfast" || raw === "lunch" || raw === "dinner" || raw === "snack") return raw;
  return "lunch";
}

/**
 * Group raw food_log rows into a GroupedMeals structure.
 * Scales per-100g macro values to the actual quantity_g.
 * Preserves the insertion order within each meal group.
 */
export function groupLogsByMeal(logs: RawFoodLog[]): GroupedMeals {
  const groups = emptyGroupedMeals();

  for (const log of logs) {
    const meal = toMealType(log.meal_type);
    const f    = (log.quantity_g ?? 0) / 100;
    const p100 = log.nutrients_json?.per100g ?? {};

    const scale = (key: string): number | null => {
      const v = p100[key];
      return typeof v === "number" ? v * f : null;
    };

    groups[meal].push({
      id:            log.id,
      product_name:  log.product_name,
      brand:         log.brand ?? null,
      meal_type:     meal,
      quantity_g:    log.quantity_g,
      calories_kcal: log.calories_kcal,
      logged_at:     log.logged_at,
      protein:       scale("protein"),
      carbs:         scale("carbs"),
      fat:           scale("fat"),
      fiber:         scale("fiber"),
    });
  }

  return groups;
}
