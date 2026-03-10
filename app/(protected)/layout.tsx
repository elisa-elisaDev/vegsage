import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28">
      {children}

      {/* Bottom nav — mobile */}
      <nav
        aria-label="App navigation"
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 z-40 sm:hidden"
      >
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-0.5 text-xs text-gray-500 hover:text-brand-600 transition-colors px-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {t.nav.dashboard}
        </Link>
        <Link
          href="/add"
          aria-label={t.nav.addFood}
          className="flex flex-col items-center"
        >
          <span className="w-12 h-12 rounded-full bg-brand-600 text-white text-2xl flex items-center justify-center shadow-md hover:bg-brand-700 transition-colors -mt-4">
            +
          </span>
        </Link>
        <Link
          href="/settings"
          className="flex flex-col items-center gap-0.5 text-xs text-gray-500 hover:text-brand-600 transition-colors px-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t.settings.title}
        </Link>
      </nav>

      {/* Desktop floating add button */}
      <Link
        href="/add"
        aria-label={t.nav.addFood}
        className="hidden sm:flex fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-600 text-white text-2xl items-center justify-center shadow-lg hover:bg-brand-700 transition-colors z-50"
      >
        +
      </Link>
    </div>
  );
}
