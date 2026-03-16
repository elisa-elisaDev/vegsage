import Link from "next/link";
import type { Dict, Locale } from "@/lib/i18n";
import { HeaderAuthSection } from "./HeaderAuthSection";

interface HeaderProps {
  t: Dict;
  locale: Locale;
  isAuthed?: boolean;
  userEmail?: string;
}

export function Header({ t, locale, isAuthed = false }: HeaderProps) {
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

        {/* Auth-aware nav + right side (client component for immediate updates) */}
        <HeaderAuthSection initialIsAuthed={isAuthed} t={t} locale={locale} />
      </div>
    </header>
  );
}
