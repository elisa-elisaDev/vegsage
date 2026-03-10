"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

interface LocaleSwitcherProps {
  locale: Locale;
}

const LABELS: Record<Locale, string> = { en: "EN", fr: "FR", de: "DE" };

export function LocaleSwitcher({ locale }: LocaleSwitcherProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {(["en", "fr", "de"] as Locale[]).map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">·</span>}
          {l === locale ? (
            <span className="text-brand-600 font-semibold">{LABELS[l]}</span>
          ) : (
            <a
              href={`/api/locale?locale=${l}&next=${encodeURIComponent(pathname)}`}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              {LABELS[l]}
            </a>
          )}
        </span>
      ))}
    </div>
  );
}
