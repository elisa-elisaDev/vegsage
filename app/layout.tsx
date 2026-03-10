import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LocaleProvider } from "@/components/LocaleContext";
import { SWRegister } from "./sw-register";
import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const metadata: Metadata = {
  title: "VegSage — Vegetarian Nutrition Tracker",
  description:
    "Feel confident about your vegetarian nutrition. Track key micro-nutrients and your Vegetarian Confidence Score.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", type: "image/png" },
    ],
    apple: "/icons/apple-icon.png",
    shortcut: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col">
        <LocaleProvider value={{ locale, t }}>
          <SWRegister />
          <Header t={t} locale={locale} isAuthed={!!user} userEmail={user?.email} />
          <main className="flex-1">{children}</main>
          <Footer t={t} />
        </LocaleProvider>
      </body>
    </html>
  );
}
