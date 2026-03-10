import { NextRequest, NextResponse } from "next/server";
import { vegSageSearch } from "@/lib/vegSageSearch";
import type { Locale } from "@/lib/i18n";

const VALID_LOCALES: Locale[] = ["en", "fr", "de"];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ products: [] });
  }

  const rawLocale = req.nextUrl.searchParams.get("locale") ?? "en";
  const locale: Locale = VALID_LOCALES.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : "en";

  const products = await vegSageSearch(q.trim(), 12, locale);
  return NextResponse.json({ products });
}
