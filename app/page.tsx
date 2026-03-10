import Link from "next/link";
import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
<div className="max-w-md mx-auto flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-3xl"
            aria-hidden="true"
          >
            🌿
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.common.appName}</h1>
        </div>

        {/* Tagline */}
        <div className="flex flex-col gap-3">
          <p className="text-xl font-semibold text-gray-800">{t.common.tagline}</p>
          <p className="text-gray-500 text-sm leading-relaxed">
            {locale === "fr"
              ? "Suivez les nutriments essentiels pour les végétariens — B12, fer, calcium et plus — et obtenez votre Score de Confiance Végétarien chaque jour."
              : locale === "de"
              ? "Verfolgen Sie die wichtigsten Nährstoffe für Vegetarier — B12, Eisen, Kalzium und mehr — und erhalten Sie täglich Ihren Vegetarischen Vertrauens-Score."
              : "Track the nutrients that matter most for vegetarians — B12, iron, calcium and more — and get your Vegetarian Confidence Score every day."}
          </p>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2" role="list" aria-label="Features">
          {(locale === "fr"
            ? ["Score glissant 7 jours", "6 nutriments clés", "Insights intelligents", "Données USDA vérifiées"]
            : locale === "de"
            ? ["7-Tage-Rolling-Score", "6 Schlüsselnährstoffe", "Smarte Insights", "USDA-geprüfte Daten"]
            : ["7-day rolling score", "6 key nutrients", "Smart insights", "USDA-verified data"]
          ).map((f) => (
            <span
              key={f}
              role="listitem"
              className="bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full border border-brand-100"
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/signup"
            className="flex-1 rounded-xl bg-brand-600 text-white py-3.5 text-sm font-semibold text-center hover:bg-brand-700 transition-colors"
          >
            {t.auth.signUpCTA}
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded-xl border border-gray-200 text-gray-700 py-3.5 text-sm font-semibold text-center hover:bg-gray-50 transition-colors"
          >
            {t.nav.signIn}
          </Link>
        </div>

        <p className="text-xs text-gray-400">{t.common.notMedicalAdvice}</p>
      </div>
    </div>
  );
}
