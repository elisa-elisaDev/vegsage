import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { SignOutButton } from "../SignOutButton";
import { PremiumRefresher } from "@/components/PremiumRefresher";
import Link from "next/link";
import { GoalsForm } from "@/components/GoalsForm";
import { parseGoals, GOAL_KEYS } from "@/lib/goals";
import { resolveGoals } from "@/lib/nutrition";
import type { GoalKey } from "@/lib/goals";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);

  const params = await searchParams;
  const upgradedParam = params.upgraded;
  const showUpgradeBannerParam = upgradedParam === "1";

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("is_premium, premium_expires_at, vegetarian_type, locale, daily_goals_json")
    .eq("id", user.id)
    .single();

  if (profileErr) {
    console.error(
      "[settings] profile query failed:",
      profileErr.code,
      profileErr.message,
      "— is_premium will default to false. Check that all migrations have been run."
    );
  }

  const isPremium = profile?.is_premium ?? false;
  const showUpgradeBanner = showUpgradeBannerParam && isPremium;
  const vegType = profile?.vegetarian_type ?? "ovo_lacto";

  const userGoals = parseGoals(profile?.daily_goals_json ?? null);
  const resolved = resolveGoals(userGoals);
  const initialGoals = Object.fromEntries(
    GOAL_KEYS.map((k) => [k, resolved[k]])
  ) as Record<GoalKey, number>;

  const premiumExpires = profile?.premium_expires_at
    ? new Date(profile.premium_expires_at).toLocaleDateString(
        locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      )
    : null;

  return (
    <div className="flex flex-col gap-6 pt-4 pb-8">
      <h1 className="text-xl font-bold text-gray-900">{t.settings.title}</h1>

      {/* Poll for webhook update if user just paid but DB not yet updated */}
      {showUpgradeBannerParam && <PremiumRefresher isPremium={isPremium} />}

      {/* Upgrade success banner — shown only once DB confirms is_premium */}
      {showUpgradeBanner && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-green-500 text-xl leading-none mt-0.5">✓</span>
            <div>
              <p className="text-sm font-semibold text-green-700">
                {t.settings.premiumActive}
              </p>
              <p className="text-xs text-green-600 mt-0.5">{t.pricing.paddleNote}</p>
            </div>
          </div>
      )}

      {/* Account */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t.settings.accountSection}
        </p>

        <div>
          <p className="text-xs text-gray-500 mb-0.5">{t.settings.emailLabel}</p>
          <p className="text-sm font-medium text-gray-900">{user.email}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1">{t.settings.vegTypeLabel}</p>
          <p className="text-sm text-gray-700">
            {t.settings.vegTypeOptions[vegType as keyof typeof t.settings.vegTypeOptions] ??
              vegType}
          </p>
        </div>
      </section>

      {/* Daily Goals */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t.settings.goalsSection}
        </p>
        <GoalsForm initialGoals={initialGoals} t={t} />
      </section>

      {/* Language */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t.settings.localeLabel}
        </p>
        <div className="flex gap-2">
          {(["en", "fr", "de"] as const).map((l) => (
            <a
              key={l}
              href={`/api/locale?locale=${l}&next=/settings`}
              className={`flex-1 text-center rounded-xl border py-2 text-sm font-medium transition-colors ${
                locale === l
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.settings.localeOptions[l]}
            </a>
          ))}
        </div>
      </section>

      {/* Premium */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t.settings.premiumSection}
        </p>
        {isPremium ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-green-600">{t.settings.premiumActive}</p>
            {premiumExpires && (
              <p className="text-xs text-gray-500">
                {t.settings.premiumExpires} {premiumExpires}
              </p>
            )}
          </div>
        ) : (
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            {t.pricing.upgradeBtn} →
          </Link>
        )}
      </section>

      {/* Data sources */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t.settings.dataSourceSection}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">{t.settings.dataSourceDesc}</p>
      </section>

      {/* Legal links */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
          {t.settings.legalSection}
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-brand-600">
          <Link href="/legal/terms" className="hover:underline">
            {t.footer.terms}
          </Link>
          <Link href="/legal/privacy" className="hover:underline">
            {t.footer.privacy}
          </Link>
          <Link href="/legal/refunds" className="hover:underline">
            {t.footer.refunds}
          </Link>
          <Link href="/legal/contact" className="hover:underline">
            {t.footer.contact}
          </Link>
        </div>
      </section>

      {/* Sign out */}
      <div className="flex justify-center pt-2">
        <SignOutButton label={t.settings.signOut} />
      </div>
    </div>
  );
}