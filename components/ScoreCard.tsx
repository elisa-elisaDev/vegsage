"use client";

import {
  scoreColor,
  getScoreMode,
  computeAdjustedScore,
  getFoodSuggestions,
} from "@/lib/scoring";
import type { ScoreBreakdown } from "@/lib/scoring";
import type { Dict } from "@/lib/i18n";
import type { NutrientKey } from "@/lib/nutrition";

const SCORED_KEYS: NutrientKey[] = ["b12", "iron", "protein", "calcium", "omega3", "zinc"];
const RADIUS = 54;
const CIRC = 2 * Math.PI * RADIUS;

interface ScoreCardProps {
  score: number;
  breakdown: ScoreBreakdown;
  totals: Record<string, number>;
  logCount: number;
  t: Dict;
  loading?: boolean;
}

export function ScoreCard({
  score,
  breakdown,
  totals,
  logCount,
  t,
  loading = false,
}: ScoreCardProps) {
  const mode = getScoreMode(logCount, breakdown, totals);
  const { score: adjustedScore } =
    mode === "ready" ? computeAdjustedScore(breakdown, totals) : { score };

  const displayScore = mode === "ready" ? adjustedScore : score;
  const color = scoreColor(displayScore);

  // Diagnostic: top 2 good nutrients (score ≥ 75) + top 2 worst (score < 75), max 4 total
  const diagItems: NutrientKey[] = (() => {
    if (mode !== "ready") return [];
    const sorted = [...SCORED_KEYS].sort(
      (a, b) => (breakdown[b] ?? 0) - (breakdown[a] ?? 0)
    ); // descending
    const good = sorted.filter((k) => (breakdown[k] ?? 0) >= 75).slice(0, 2);
    const bad = sorted.filter((k) => (breakdown[k] ?? 0) < 75).reverse().slice(0, 2); // worst first
    return [...good, ...bad];
  })();

  const suggestions =
    mode === "ready" ? getFoodSuggestions(breakdown, t.suggestions, 3) : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {t.score.globalScore}
      </p>

      {/* ── Arc visual ── */}
      {loading ? (
        <div className="w-32 h-32 rounded-full bg-gray-100 animate-pulse" />
      ) : mode === "building" ? (
        <div className="w-32 h-32 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
          <span className="text-4xl" role="img" aria-label="growing">🌱</span>
        </div>
      ) : (
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg
            className="absolute inset-0 -rotate-90"
            width="128"
            height="128"
            viewBox="0 0 128 128"
          >
            <circle cx="64" cy="64" r={RADIUS} strokeWidth="10" stroke="#f3f4f6" fill="none" />
            {mode === "ready" && (
              <circle
                cx="64"
                cy="64"
                r={RADIUS}
                strokeWidth="10"
                stroke={
                  displayScore > 70 ? "#22c55e" : displayScore >= 40 ? "#f97316" : "#ef4444"
                }
                fill="none"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC - CIRC * (displayScore / 100)}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>
          {mode === "insufficient" ? (
            <span className="relative text-3xl" role="img" aria-label="warning">⚠️</span>
          ) : (
            <span className="relative text-3xl font-bold text-gray-900">
              {Math.round(displayScore)}
            </span>
          )}
        </div>
      )}

      {/* ── Status label ── */}
      {mode === "building" ? (
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-600">{t.dashboard.scoreBuilding}</p>
          <p className="text-xs text-gray-400 mt-1">{t.dashboard.scoreBuildingHint}</p>
        </div>
      ) : mode === "insufficient" ? (
        <div className="text-center">
          <p className="text-sm font-semibold text-amber-600">{t.dashboard.scoreInsufficient}</p>
          <p className="text-xs text-gray-400 mt-1">{t.dashboard.scoreInsufficientHint}</p>
        </div>
      ) : (
        <>
          <span className={`text-sm font-semibold ${color}`}>
            {displayScore > 70
              ? t.dashboard.scoreOnTrack
              : displayScore >= 40
              ? t.dashboard.scoreModerate
              : t.dashboard.scoreNeedsAttention}
          </span>
          <p className="text-xs text-gray-400 text-center">{t.dashboard.scoreExplainer}</p>
        </>
      )}

      {/* ── Diagnostic ── */}
      {mode === "ready" && diagItems.length > 0 && (
        <div className="w-full border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            {t.dashboard.diagnosisTitle}
          </p>
          <ul className="flex flex-col gap-1.5">
            {diagItems.map((k) => {
              const isOk = (breakdown[k] ?? 0) >= 75;
              const label = (t.nutrients as Record<string, string>)[k] ?? k;
              return (
                <li key={k} className="flex items-center gap-2 text-sm">
                  <span className={isOk ? "text-green-500" : "text-amber-500"}>
                    {isOk ? "✔" : "⚠"}
                  </span>
                  <span className="text-gray-700">
                    {label}{" "}
                    <span
                      className={`font-medium ${
                        isOk ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      {isOk ? t.dashboard.diagnosisOkSuffix : t.dashboard.diagnosisFailSuffix}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Suggestions ── */}
      {mode === "ready" && suggestions.length > 0 && (
        <div className="w-full border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            {t.dashboard.suggestionTitle}
          </p>
          <p className="text-xs text-gray-500 mb-2">{t.dashboard.suggestionIntro}</p>
          <ul className="flex flex-col gap-1">
            {suggestions.map((food) => (
              <li key={food} className="text-sm text-gray-700 flex items-center gap-1.5">
                <span className="text-brand-500 font-bold">•</span>
                {food}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
