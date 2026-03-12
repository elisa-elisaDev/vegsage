import Link from "next/link";
import type { Dict, Locale } from "@/lib/i18n";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { HeaderMobileNav } from "./HeaderMobileNav";

interface HeaderProps {
  t: Dict;
  locale: Locale;
  isAuthed?: boolean;
  userEmail?: string;
}

export function Header({ t, locale, isAuthed, userEmail: _userEmail }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-gray-900 text-lg flex-shrink-0"
        >
          <span aria-hidden="true">🌿</span>
          <span>{t.common.appName}</span>
        </Link>

        {/* Nav — authenticated, desktop */}
        {isAuthed && (
          <nav
            aria-label="Main navigation"
            className="hidden sm:flex items-center gap-4 text-sm"
          >
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t.nav.dashboard}
            </Link>
            <Link href="/score" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t.nav.score}
            </Link>
            <Link href="/settings" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t.nav.settings}
            </Link>
          </nav>
        )}

        {/* Nav — authenticated, mobile (suppressed on protected pages that have their own bottom nav) */}
        {isAuthed && <HeaderMobileNav t={t} />}

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <LocaleSwitcher locale={locale} />
          {!isAuthed && (
            <Link
              href="/login"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {t.nav.signIn}
            </Link>
          )}
          {!isAuthed && (
            <Link
              href="/signup"
              className="hidden sm:inline-flex text-sm font-semibold bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
            >
              {t.nav.signUp}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
