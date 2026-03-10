"use client";

import { createContext, useContext } from "react";
import type { Locale, Dict } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n";

interface LocaleCtx {
  locale: Locale;
  t: Dict;
}

const LocaleContext = createContext<LocaleCtx>({ locale: "en", t: dictionaries.en });

export const useLocale = () => useContext(LocaleContext);

export function LocaleProvider({
  value,
  children,
}: {
  value: LocaleCtx;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
