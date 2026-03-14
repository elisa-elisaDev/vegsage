"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleContext";
import type { FoodProduct } from "@/lib/usdaClient";
import { NUTRIENT_UNITS, formatNutrient } from "@/lib/nutrition";
import type { NutrientKey } from "@/lib/nutrition";

type Step = "search" | "quantity";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const QUICK_AMOUNTS = [50, 100, 150, 200];

// Macro + key micro shown in the preview panel
const PREVIEW_NUTRIENTS: NutrientKey[] = [
  "fat", "carbs", "fiber", "protein",
  "b12", "iron", "calcium", "omega3", "zinc",
];

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── Client-side query cache (localStorage, 5-min TTL) ───────────────────────

const SEARCH_CACHE_KEY = "vs_search_v2";
const SEARCH_CACHE_TTL = 5 * 60 * 1000;
const SEARCH_CACHE_MAX = 50;

function getCachedResults(query: string, locale: string): FoodProduct[] | null {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as Record<string, { products: FoodProduct[]; ts: number }>;
    const entry = cache[`${locale}:${query}`];
    if (!entry || Date.now() - entry.ts > SEARCH_CACHE_TTL) return null;
    return entry.products;
  } catch { return null; }
}

function setCachedResults(query: string, locale: string, products: FoodProduct[]): void {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    const cache: Record<string, { products: FoodProduct[]; ts: number }> = raw ? JSON.parse(raw) : {};
    cache[`${locale}:${query}`] = { products, ts: Date.now() };
    const keys = Object.keys(cache);
    if (keys.length > SEARCH_CACHE_MAX) {
      keys.sort((a, b) => cache[a].ts - cache[b].ts)
          .slice(0, keys.length - SEARCH_CACHE_MAX)
          .forEach((k) => delete cache[k]);
    }
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
  } catch { /* storage full — silently skip */ }
}

// ─── Meal type config ─────────────────────────────────────────────────────────

const MEAL_TYPES: { id: MealType; icon: string }[] = [
  { id: "breakfast", icon: "☀️" },
  { id: "lunch",     icon: "🌿" },
  { id: "dinner",    icon: "🌙" },
  { id: "snack",     icon: "🍎" },
];

const MEAL_LABEL_KEYS: Record<MealType, "mealBreakfast" | "mealLunch" | "mealDinner" | "mealSnack"> = {
  breakfast: "mealBreakfast",
  lunch:     "mealLunch",
  dinner:    "mealDinner",
  snack:     "mealSnack",
};

function AddFoodInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { t, locale } = useLocale();

  const MEAL_VALUES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
  const rawMeal = params.get("meal") ?? "lunch";
  const initialMeal: MealType = MEAL_VALUES.includes(rawMeal as MealType)
    ? (rawMeal as MealType)
    : "lunch";

  const [step, setStep] = useState<Step>("search");
  const [selected, setSelected] = useState<FoodProduct | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [quantity, setQuantity] = useState(100);
  const [mealType, setMealType] = useState<MealType>(initialMeal);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (q: string) => {
      if (!q || q.trim().length < 2) { setResults([]); return; }

      const cached = getCachedResults(q.trim(), locale);
      if (cached) { setResults(cached); return; }

      setSearching(true);
      try {
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(q.trim())}&locale=${locale}`);
        const data = await res.json();
        const products: FoodProduct[] = data.products ?? [];
        setResults(products);
        if (products.length > 0) setCachedResults(q.trim(), locale, products);
      } catch { setError(t.errors.network); }
      finally { setSearching(false); }
    }, 300),
    [t, locale]
  );

  async function handleAdd() {
    if (!selected) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: selected, quantityG: quantity, mealType }),
      });
      if (!res.ok) { await res.json(); setError(t.addFood.addError); setAdding(false); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t.errors.network);
      setAdding(false);
    }
  }

  const safeQty = Number.isFinite(quantity) && quantity >= 1 ? Math.min(quantity, 2000) : 100;
  const factor = safeQty / 100;

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8">
      <div className="flex items-center gap-3">
        {step === "quantity" && (
          <button
            onClick={() => { setStep("search"); setSelected(null); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {t.addFood.back}
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">{t.addFood.title}</h1>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* ── SEARCH STEP ── */}
      {step === "search" && (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="food-search" className="block text-sm font-medium text-gray-700 mb-1">
              {t.addFood.searchLabel}
            </label>
            <input
              id="food-search"
              type="search"
              autoFocus
              placeholder={t.addFood.searchPlaceholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); debouncedSearch(e.target.value); }}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Results */}
          {searching ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" aria-label={t.addFood.searching} />
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden" role="listbox" aria-label="Search results">
              {results.map((p) => (
                <li key={p.off_id} role="option" aria-selected={false}>
                  <button
                    onClick={() => { setSelected(p); setStep("quantity"); }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.per100g.calories != null ? `${Math.round(p.per100g.calories)} ${t.nutrients.kcal}` : "—"}
                      {" · "}
                      {p.per100g.protein != null ? `${p.per100g.protein.toFixed(1)}g ${t.nutrients.protein.toLowerCase()}` : "—"}
                      {" · "}
                      {p.per100g.carbs != null ? `${p.per100g.carbs.toFixed(1)}g ${t.nutrients.carbs.toLowerCase()}` : "—"}
                      {" · "}
                      {t.addFood.perHundredG}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 && !searching ? (
            <p className="text-sm text-gray-400 text-center py-4">{t.addFood.noResults}</p>
          ) : null}
        </div>
      )}

      {/* ── QUANTITY STEP ── */}
      {step === "quantity" && selected && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="font-semibold text-gray-900 line-clamp-2">{selected.name}</p>
            <p className="text-xs text-gray-400 mt-1">{t.addFood.source}</p>
          </div>

          {/* Meal type selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{t.addFood.mealTypeLabel}</p>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(({ id, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMealType(id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-colors ${
                    mealType === id
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg leading-none">{icon}</span>
                  <span>{t.addFood[MEAL_LABEL_KEYS[id]] as string}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="qty" className="block text-sm font-medium text-gray-700 mb-1">
              {t.addFood.quantityLabel}
            </label>
            <input
              id="qty"
              type="number"
              inputMode="numeric"
              min={1}
              max={2000}
              step={1}
              value={quantity}
              onKeyDown={(e) => {
                // Allow Ctrl/Cmd shortcuts (select all, copy, paste, cut, undo, redo)
                if (e.ctrlKey || e.metaKey) return;
                const allowed = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
                if (allowed.includes(e.key)) return;
                if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
                const cur = (e.target as HTMLInputElement).value.replace(/\D/g, "");
                if (cur.length >= 4) e.preventDefault();
              }}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                if (!Number.isFinite(parsed) || parsed < 1) {
                  setQuantity(100);
                } else {
                  setQuantity(Math.min(2000, parsed));
                }
              }}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex gap-2 mt-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setQuantity(a)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                    quantity === a
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {a}{t.addFood.unitG}
                </button>
              ))}
            </div>
          </div>

          {/* Nutritional preview */}
          <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
            <p className="font-medium text-gray-700 mb-2">{t.addFood.nutrientsPreview}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {/* Calories — full width */}
              <div className="flex justify-between col-span-2 border-b border-gray-200 pb-1 mb-1">
                <span className="text-gray-600">{t.nutrients.calories}</span>
                <span className="font-semibold">
                  {selected.per100g.calories != null && Number.isFinite(selected.per100g.calories * factor)
                    ? `${Math.round(selected.per100g.calories * factor)} ${t.nutrients.kcal}`
                    : "—"}
                </span>
              </div>
              {/* Macros + micros */}
              {PREVIEW_NUTRIENTS.map((key) => {
                const raw = selected.per100g[key];
                const val = raw != null && Number.isFinite(raw * factor) ? raw * factor : null;
                const unit = NUTRIENT_UNITS[key];
                const label = (t.nutrients as Record<string, string>)[key] ?? key;
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800">
                      {val != null ? `${formatNutrient(val, key)}${unit}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep("search"); setSelected(null); }}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {adding ? t.addFood.addingToLog : t.addFood.addToLog}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddFoodPage() {
  return (
    <Suspense>
      <AddFoodInner />
    </Suspense>
  );
}
