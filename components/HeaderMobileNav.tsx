"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dict } from "@/lib/i18n";

// Routes that already have a bottom nav via the (protected) layout.
// On those pages we suppress this component to avoid duplicating navigation.
const PROTECTED = ["/dashboard", "/add", "/score", "/settings"];

export function HeaderMobileNav({ t }: { t: Dict }) {
  const pathname = usePathname();

  if (PROTECTED.some((r) => pathname.startsWith(r))) return null;

  return (
    <nav aria-label="App navigation" className="flex sm:hidden items-center gap-5">
      <Link
        href="/dashboard"
        aria-label={t.nav.dashboard}
        className="text-gray-500 hover:text-brand-600 transition-colors"
      >
        {/* Home / Dashboard */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>

      <Link
        href="/score"
        aria-label={t.nav.score}
        className="text-gray-500 hover:text-brand-600 transition-colors"
      >
        {/* Score / Chart */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </Link>

      <Link
        href="/settings"
        aria-label={t.nav.settings}
        className="text-gray-500 hover:text-brand-600 transition-colors"
      >
        {/* Settings / Profile */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
    </nav>
  );
}
