import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { scoreColor, SCORED_NUTRIENTS, computeDailyNutrientSummary } from "@/lib/scoring";
import { NUTRIENT_LABELS, NUTRIENT_UNITS, DAILY_TARGETS, PREMIUM_NUTRIENT_KEYS, formatNutrient } from "@/lib/nutrition";
import type { NutrientKey } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

const TIPS: Record<NutrientKey, { en: string; fr: string; de: string }> = {
  calories: { en: "", fr: "", de: "" },
  fat:      { en: "", fr: "", de: "" },
  carbs:    { en: "", fr: "", de: "" },
  fiber:    { en: "", fr: "", de: "" },
  sugar:    { en: "", fr: "", de: "" },
  sodium:   { en: "", fr: "", de: "" },
  b12: {
    en: "Fortified foods (plant milks, cereals), dairy, eggs, or supplements.",
    fr: "Aliments enrichis (laits végétaux, céréales), produits laitiers, œufs ou compléments.",
    de: "Angereicherte Lebensmittel (Pflanzenmilch, Cerealien), Milchprodukte, Eier oder Supplemente.",
  },
  iron: {
    en: "Lentils, beans, tofu, spinach — pair with vitamin C for better absorption.",
    fr: "Lentilles, haricots, tofu, épinards — associez à de la vitamine C pour une meilleure absorption.",
    de: "Linsen, Bohnen, Tofu, Spinat — kombinieren Sie mit Vitamin C für bessere Aufnahme.",
  },
  protein: {
    en: "Legumes, tofu, tempeh, seitan, dairy, eggs.",
    fr: "Légumineuses, tofu, tempeh, seitan, produits laitiers, œufs.",
    de: "Hülsenfrüchte, Tofu, Tempeh, Seitan, Milchprodukte, Eier.",
  },
  calcium: {
    en: "Fortified plant milks, dairy, tofu (calcium-set), kale, bok choy.",
    fr: "Laits végétaux enrichis, produits laitiers, tofu (au sulfate de calcium), chou kale, bok choy.",
    de: "Angereicherte Pflanzenmilch, Milchprodukte, Kalzium-Tofu, Grünkohl, Pak Choi.",
  },
  omega3: {
    en: "Chia seeds, flaxseeds, hemp seeds, walnuts, algae-based supplements.",
    fr: "Graines de chia, lin, chanvre, noix, compléments à base d'algues.",
    de: "Chiasamen, Leinsamen, Hanfsamen, Walnüsse, Algenpräparate.",
  },
  zinc: {
    en: "Pumpkin seeds, legumes, whole grains, cheese, cashews.",
    fr: "Graines de courge, légumineuses, céréales complètes, fromage, noix de cajou.",
    de: "Kürbiskerne, Hülsenfrüchte, Vollkorn, Käse, Cashewkerne.",
  },
  vitaminD: {
    en: "Sun exposure, fortified plant milks, fortified cereals, eggs, or supplements.",
    fr: "Exposition solaire, laits végétaux enrichis, céréales enrichies, œufs ou compléments.",
    de: "Sonnenlicht, angereicherte Pflanzenmilch, angereicherte Cerealien, Eier oder Supplemente.",
  },
  vitaminC: {
    en: "Bell peppers, citrus fruits, kiwi, strawberries, broccoli.",
    fr: "Poivrons, agrumes, kiwi, fraises, brocoli.",
    de: "Paprika, Zitrusfrüchte, Kiwi, Erdbeeren, Brokkoli.",
  },
};

export default async function ScorePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);

  const today = new Date().toISOString().slice(0, 10);
  const { data: summary } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .eq("summary_date", today)
    .maybeSingle();

  const score = summary?.confidence_score ?? 0;
  const totals = (summary?.totals_json ?? {}) as Record<string, number>;

  const hasSummary = !!summary;

  // Structured daily summary (new output format)
  const dailySummary = hasSummary
    ? computeDailyNutrientSummary(totals, DAILY_TARGETS)
    : null;

  // Fetch profile to gate Premium vitamin section
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  if (profileErr) {
    console.error("[score] profile query failed:", profileErr.code, profileErr.message,
      "— is_premium will default to false. Check that all migrations have been run.");
  }

  const isPremium = profile?.is_premium ?? false;

  // Compute Premium vitamin totals from today's food_logs
  // (not yet in daily_summaries — computed client-side from raw logs)
  type PremiumTotals = Record<"vitaminD" | "vitaminC", number>;
  let premiumTotals: PremiumTotals | null = null;
  if (isPremium) {
    const { data: foodLogs } = await supabase
      .from("food_logs")
      .select("quantity_g, nutrients_json")
      .eq("user_id", user.id)
      .eq("log_date", today);

    if (foodLogs && foodLogs.length > 0) {
      premiumTotals = foodLogs.reduce<PremiumTotals>(
        (acc, log) => {
          const f = (log.quantity_g ?? 0) / 100;
          const p = (log.nutrients_json as { per100g?: Record<string, number | null> })?.per100g ?? {};
          return {
            vitaminD: acc.vitaminD + ((p.vitaminD ?? 0) * f),
            vitaminC: acc.vitaminC + ((p.vitaminC ?? 0) * f),
          };
        },
        { vitaminD: 0, vitaminC: 0 }
      );
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-xl font-bold text-gray-900">{t.score.title}</h1>

      {/* Global score */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t.score.globalScore}
        </p>
        <p className="text-5xl font-bold text-gray-900">{Math.round(score)}</p>
        <span className={`text-sm font-semibold ${scoreColor(score)}`}>
          {score > 70
            ? t.dashboard.scoreOnTrack
            : score >= 40
            ? t.dashboard.scoreModerate
            : t.dashboard.scoreNeedsAttention}
        </span>
        <p className="text-xs text-gray-400 text-center">{t.dashboard.scoreExplainer}</p>
      </div>

      {/* Explanation */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-brand-800 mb-2">
          {locale === "fr" ? "Comment est calculé votre score ?" : locale === "de" ? "Wie wird Ihr Score berechnet?" : "How is your score calculated?"}
        </p>
        <p className="text-sm text-brand-700 leading-relaxed">{t.score.explanation}</p>
      </div>

      {!hasSummary ? (
        <p className="text-sm text-gray-400 text-center py-8">{t.score.notEnoughData}</p>
      ) : (
        <>
          {/* Structured daily summary */}
          {dailySummary && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {t.score.breakdownTitle}
                </p>
                <span className={`text-sm font-bold ${scoreColor(dailySummary.score)}`}>
                  {Math.round(dailySummary.score)}/100
                </span>
              </div>
              {SCORED_NUTRIENTS.map((key) => {
                const nkey    = key as NutrientKey;
                const { intake, target, coverage } = dailySummary.nutrients[key];
                const unit    = NUTRIENT_UNITS[nkey];
                const pct     = Math.round(coverage * 100);
                const barColor = coverage >= 1 ? "bg-green-500" : coverage >= 0.5 ? "bg-yellow-400" : "bg-red-400";
                const tip     = TIPS[nkey]?.[locale] ?? "";

                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-800">{NUTRIENT_LABELS[nkey]}</span>
                      <span className="text-gray-500 tabular-nums">
                        {intake.toFixed(1)} / {target}{unit}
                        <span className={`ml-2 text-xs font-semibold ${
                          coverage >= 1 ? "text-green-600" : coverage >= 0.5 ? "text-yellow-600" : "text-red-500"
                        }`}>
                          {pct}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    {tip && <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Premium vitamin section — Vitamin D & C */}
      {isPremium && premiumTotals && (
        <div className="bg-white rounded-2xl border border-brand-100 p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
              {t.nutrients.premiumVitaminsTitle}
            </p>
            <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
              Premium
            </span>
          </div>
          {PREMIUM_NUTRIENT_KEYS.map((key) => {
            const nkey = key as NutrientKey;
            const value = premiumTotals![key as keyof PremiumTotals] ?? 0;
            const target = DAILY_TARGETS[nkey];
            const unit = NUTRIENT_UNITS[nkey];
            const pct = (value / target) * 100;

            return (
              <div key={key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{NUTRIENT_LABELS[nkey]}</span>
                  <span className="text-gray-500">
                    {formatNutrient(value, nkey)} / {target}{unit}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">{t.common.notMedicalAdvice}</p>
    </div>
  );
}
