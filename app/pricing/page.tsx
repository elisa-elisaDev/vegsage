import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { PricingClient } from "./PricingClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);

  let isPremium = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single();
    isPremium = profile?.is_premium ?? false;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-8">
      {/* Back */}
      <Link href={user ? "/dashboard" : "/"} className="text-sm text-brand-600 hover:underline">
        ← {t.common.backToHome}
      </Link>

      <div className="text-center flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{t.pricing.title}</h1>
        <p className="text-gray-500">{t.pricing.subtitle}</p>
      </div>

      {isPremium ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <p className="text-green-700 font-semibold">{t.pricing.alreadyPremium}</p>
          <Link href="/settings" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            {t.nav.settings} →
          </Link>
        </div>
      ) : (
        <PricingClient t={t} userEmail={user?.email ?? undefined} userId={user?.id} />
      )}

      {/* Free tier */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col gap-3">
        <p className="font-semibold text-gray-700">{t.pricing.freeTitle}</p>
        <ul className="flex flex-col gap-1.5">
          {t.pricing.freeFeatures.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-gray-400">✓</span> {f}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-gray-400 text-center">{t.common.notMedicalAdvice}</p>
    </div>
  );
}
