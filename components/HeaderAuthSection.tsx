"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { HeaderMobileNav } from "./HeaderMobileNav";
import type { Dict, Locale } from "@/lib/i18n";

interface Props {
  initialIsAuthed: boolean;
  t: Dict;
  locale: Locale;
}

export function HeaderAuthSection({ initialIsAuthed, t, locale }: Props) {
  const [isAuthed, setIsAuthed] = useState(initialIsAuthed);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Sync with current session immediately on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Desktop authenticated nav */}
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

      {/* Mobile nav icons (suppressed on protected pages that have their own bottom nav) */}
      {isAuthed && <HeaderMobileNav t={t} />}

      {/* Right side: locale switcher + auth links */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <LocaleSwitcher locale={locale} />
        {isAuthed ? (
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t.nav.signOut}
          </button>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {t.nav.signIn}
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex text-sm font-semibold bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
            >
              {t.nav.signUp}
            </Link>
          </>
        )}
      </div>
    </>
  );
}
