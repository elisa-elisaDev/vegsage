import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { ScoreCard } from "@/components/ScoreCard";
import { NutrientBar } from "@/components/NutrientBar";
import { InsightCard } from "@/components/InsightCard";
import { Paywall } from "@/components/Paywall";
import { MealLogSection } from "@/components/MealLogSection";
import { groupLogsByMeal } from "@/lib/mealGrouping";
import type { RawFoodLog } from "@/lib/mealGrouping";
import Link from "next/link";
import type { NutrientKey } from "@/lib/nutrition";
import { PREMIUM_NUTRIENT_KEYS, NUTRIENT_LABELS, NUTRIENT_UNITS, DAILY_TARGETS, formatNutrient, resolveGoals } from "@/lib/nutrition";
import { scoreColor, generateInsights, computeDailyInsights } from "@/lib/scoring";
import type { ScoreBreakdown } from "@/lib/scoring";
import { parseGoals, computeGoalProgress } from "@/lib/goals";
import type { GoalKey } from "@/lib/goals";

export const dynamic = "force-dynamic";

function formatDate(iso: string, locale: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);

  const today = new Date().toISOString().slice(0, 10);

  // Today's food logs
  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", today)
    .order("logged_at", { ascending: false });

  // Today's summary
  const { data: todaySummary } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .eq("summary_date", today)
    .maybeSingle();

  // 7-day history
  const sevenAgo = new Date();
  sevenAgo.setDate(sevenAgo.getDate() - 6);
  const { data: history } = await supabase
    .from("daily_summaries")
    .select("summary_date, confidence_score")
    .eq("user_id", user.id)
    .gte("summary_date", sevenAgo.toISOString().slice(0, 10))
    .order("summary_date", { ascending: false });

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium, premium_expires_at, daily_goals_json")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.is_premium ?? false;

  // Goals — resolved against defaults so we always have a target
  const userGoals     = parseGoals(profile?.daily_goals_json ?? null);
  const resolvedGoals = resolveGoals(userGoals);
  const score = todaySummary?.confidence_score ?? 0;
  const breakdown = (todaySummary?.breakdown_json ?? {}) as ScoreBreakdown;
  const totals = (todaySummary?.totals_json ?? {}) as Record<string, number>;

  // Premium vitamin totals computed from food_logs (vitaminD/C not in daily_summaries yet)
  type PremiumTotals = Record<"vitaminD" | "vitaminC", number>;
  const premiumTotals: PremiumTotals | null = isPremium && (foodLogs?.length ?? 0) > 0
    ? foodLogs!.reduce<PremiumTotals>(
        (acc, log) => {
          const f = (log.quantity_g ?? 0) / 100;
          const p = (log.nutrients_json as { per100g?: Record<string, number | null> })?.per100g ?? {};
          return {
            vitaminD: acc.vitaminD + ((p.vitaminD ?? 0) * f),
            vitaminC: acc.vitaminC + ((p.vitaminC ?? 0) * f),
          };
        },
        { vitaminD: 0, vitaminC: 0 }
      )
    : null;

  // ── Single source of truth for "is today empty?" ──────────────────────────
  // hasLogs drives ALL empty-state decisions (CTA, noData messages).
  // todaySummary is used only for totals/score data, never for empty-state logic.
  const hasLogs = !!foodLogs?.length;

  // Fallback UI only if summary absent (e.g. compute_daily_summary RPC failed).
  const fallbackTotals = !todaySummary && hasLogs
    ? foodLogs!.reduce(
        (acc, log) => {
          const f = (log.quantity_g ?? 0) / 100;
          const p = (log.nutrients_json as { per100g?: Record<string, number> })?.per100g ?? {};
          return {
            calories: acc.calories + (log.calories_kcal ?? 0),
            protein:  acc.protein  + (p.protein ?? 0) * f,
            fat:      acc.fat      + (p.fat     ?? 0) * f,
            carbs:    acc.carbs    + (p.carbs   ?? 0) * f,
            fiber:    acc.fiber    + (p.fiber   ?? 0) * f,
          };
        },
        { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
      )
    : null;

  // Goal progress — merges today's totals with user goals (or defaults)
  const activeTotals: Partial<Record<GoalKey, number>> = {
    calories: fallbackTotals?.calories ?? totals.calories ?? 0,
    protein:  fallbackTotals?.protein  ?? totals.protein  ?? 0,
    fat:      fallbackTotals?.fat      ?? totals.fat      ?? 0,
    carbs:    fallbackTotals?.carbs    ?? totals.carbs    ?? 0,
    fiber:    fallbackTotals?.fiber    ?? totals.fiber    ?? 0,
  };
  const goalProgress = computeGoalProgress(activeTotals, resolvedGoals);

  // Whether today already has a computed summary in the 7-day history
  const historyHasToday = history?.some((d) => d.summary_date === today) ?? false;

  // Synthetic pending entry prepended when food is logged but summary not yet computed.
  // Uses isPending flag instead of a sentinel score value to stay type-safe.
  const displayHistory: Array<{ summary_date: string; confidence_score: number; isPending?: boolean }> = [
    ...(hasLogs && !historyHasToday ? [{ summary_date: today, confidence_score: 0, isPending: true }] : []),
    ...(history ?? []),
  ];

  const SCORED: NutrientKey[] = ["b12", "iron", "protein", "calcium", "omega3", "fiber"];

  // Group food logs by meal for the MealLogSection
  const groupedMeals = groupLogsByMeal((foodLogs ?? []) as RawFoodLog[]);

  // Weekly insights (for ScoreCard internal use)
  const insights = Object.keys(breakdown).length > 0
    ? generateInsights(breakdown)
    : [];

  // Daily insights — based on today's actual totals, not weekly averages
  const dailyInsights = hasLogs
    ? computeDailyInsights(activeTotals as Record<string, number>, resolvedGoals)
    : [];

  return (
    <div className="flex flex-col gap-6 pt-4">
      <h1 className="text-xl font-bold text-gray-900">{t.dashboard.title}</h1>

      {/* Score Card */}
      <ScoreCard
        score={score}
        breakdown={breakdown}
        totals={totals}
        logCount={foodLogs?.length ?? 0}
        t={t}
      />

      {/* Today's totals with goal progress */}
      {hasLogs ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
          {/* Calories — full width, prominent */}
          {(() => {
            const gp = goalProgress.calories;
            const pct = Math.round(gp.progress * 100);
            const barColor = pct >= 100 ? "bg-orange-400" : pct >= 60 ? "bg-brand-500" : "bg-brand-300";
            return (
              <div>
                <div className="flex items-end justify-between mb-1">
                  <span className="text-xs text-gray-400">{t.nutrients.calories}</span>
                  <span className="text-xs text-gray-400">
                    {Math.round(gp.target)} {t.nutrients.kcal}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 leading-none mb-1.5">
                  {Math.round(gp.current)}
                  <span className="text-sm font-normal text-gray-400 ml-1">{t.nutrients.kcal}</span>
                </p>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            );
          })()}

          {/* Protein | Carbs | Fat | Fiber — 2×2 grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {(["protein", "carbs", "fat", "fiber"] as GoalKey[]).map((key) => {
              const gp  = goalProgress[key];
              const pct = Math.round(gp.progress * 100);
              const barColor = pct >= 100 ? "bg-orange-400" : pct >= 60 ? "bg-brand-400" : "bg-gray-300";
              const label = (t.nutrients as Record<string, string>)[key] ?? key;
              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs text-gray-400">
                      {gp.current.toFixed(1)}<span className="text-gray-300">/{gp.target}{t.nutrients.g}</span>
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-6 text-center">
          <p className="text-sm text-gray-400 mb-3">{t.dashboard.noData}</p>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100 transition-colors"
          >
            {t.dashboard.noDataCTA}
          </Link>
        </div>
      )}

      {/* Nutrient bars */}
      {Object.keys(breakdown).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {t.dashboard.todayTitle}
            </p>
            <Link href="/score" className="text-xs text-brand-600 font-medium">
              {t.common.learnMore} →
            </Link>
          </div>
          {SCORED.map((key) => (
            <NutrientBar
              key={key}
              nutrient={key}
              value={totals[key] ?? 0}
              score={breakdown[key] ?? 0}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Premium vitamin bars (Vitamin D & C) — only for Premium users */}
      {isPremium && premiumTotals && (
        <div className="bg-white rounded-2xl border border-brand-100 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
              {t.nutrients.premiumVitaminsTitle}
            </p>
            <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
              Premium
            </span>
          </div>
          {PREMIUM_NUTRIENT_KEYS.map((key) => {
            const value = premiumTotals[key as keyof PremiumTotals] ?? 0;
            const target = DAILY_TARGETS[key];
            const unit = NUTRIENT_UNITS[key];
            const label = NUTRIENT_LABELS[key];
            const pct = Math.min((value / target) * 100, 100);
            const color = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400";
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-gray-500">
                    {formatNutrient(value, key)} / {target}{unit}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
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

      {/* Daily insights — today-focused, from actual intake */}
      {(dailyInsights.length > 0 || insights.length > 0) && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Insights</p>
          {(dailyInsights.length > 0 ? dailyInsights : insights).map((ins) => {
            const msgKey = ins.nutrient as keyof typeof t.insights;
            const msg    = t.insights[msgKey] ?? "";
            const sev: "high" | "medium" =
              "severity" in ins && ins.severity === "missing" ? "high" :
              "severity" in ins && ins.severity === "low"     ? "high" : "medium";
            return (
              <InsightCard
                key={ins.nutrient}
                id={ins.nutrient}
                nutrient={ins.nutrient}
                severity={sev}
                message={msg}
                t={t}
              />
            );
          })}
        </div>
      )}

      {/* Meal log — always shown (empty meals show a dash) */}
      <MealLogSection initialGroups={groupedMeals} t={t} />

      {/* 7-day history */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {t.dashboard.historyTitle}
          </p>
          {!isPremium && (
            <span className="text-xs text-gray-400">{t.dashboard.freeLimitNote}</span>
          )}
        </div>

        {displayHistory.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{t.dashboard.noData}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {displayHistory.slice(0, isPremium ? undefined : 7).map((d) => {
              if (d.isPending) {
                return (
                  <li
                    key={d.summary_date}
                    className="flex items-center gap-3 px-2 py-2 rounded-xl"
                  >
                    <span className="w-24 text-xs text-gray-500 flex-shrink-0">
                      {formatDate(d.summary_date, locale)}
                    </span>
                    <div className="flex-1">
                      <span className="text-xs text-gray-400 italic">{t.dashboard.historyPending}</span>
                    </div>
                    <span className="w-8 text-right text-xs text-gray-400">—</span>
                  </li>
                );
              }
              const s = d.confidence_score;
              const barW = `${Math.round(s)}%`;
              return (
                <li
                  key={d.summary_date}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50"
                >
                  <span className="w-24 text-xs text-gray-500 flex-shrink-0">
                    {formatDate(d.summary_date, locale)}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${s >= 80 ? "bg-green-500" : s >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: barW }}
                      aria-label={`Score: ${Math.round(s)}`}
                    />
                  </div>
                  <span className={`w-8 text-right text-xs font-semibold ${scoreColor(s)}`}>
                    {Math.round(s)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {!isPremium && (
          <div className="mt-4">
            <Paywall
            feature={t.dashboard.upgradePrompt}
            features={t.dashboard.upgradeFeatures}
            t={t}
            userEmail={user.email ?? undefined}
            userId={user.id}
          />
          </div>
        )}
      </div>
    </div>
  );
}
