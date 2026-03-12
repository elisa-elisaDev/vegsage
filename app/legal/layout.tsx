import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const backHref = user ? "/dashboard" : "/";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href={backHref} className="text-sm text-brand-600 hover:underline block mb-8">
        ← {t.common.backToHome}
      </Link>
      {children}
      <div className="mt-12 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
        <Link href="/legal/terms" className="hover:text-gray-600">{t.footer.terms}</Link>
        <Link href="/legal/privacy" className="hover:text-gray-600">{t.footer.privacy}</Link>
        <Link href="/legal/refunds" className="hover:text-gray-600">{t.footer.refunds}</Link>
        <Link href="/legal/contact" className="hover:text-gray-600">{t.footer.contact}</Link>
        <Link href="/legal/data-sources" className="hover:text-gray-600">{t.footer.dataSources}</Link>
      </div>
    </div>
  );
}
