/**
 * GET /api/locale?locale=fr&next=/settings
 * Sets the locale cookie and redirects back.
 */

import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, locales } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") as Locale | null;
  const next = searchParams.get("next") ?? "/";

  if (!locale || !locales.includes(locale)) {
    return NextResponse.redirect(new URL(next, req.url));
  }

  const response = NextResponse.redirect(new URL(next, req.url));
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
