import Link from "next/link";
import type { Dict } from "@/lib/i18n";

interface FooterProps {
  t: Dict;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer className="border-t border-gray-100 py-6 mt-auto">
      <div className="max-w-2xl mx-auto px-4 flex flex-col items-center gap-3">
        <nav
          aria-label="Legal"
          className="flex flex-wrap justify-center gap-x-5 gap-y-2"
        >
          {(
            [
              ["terms", "/legal/terms"],
              ["privacy", "/legal/privacy"],
              ["refunds", "/legal/refunds"],
              ["dataSources", "/legal/data-sources"],
              ["contact", "/legal/contact"],
              ["pricing", "/pricing"],
            ] as [keyof typeof t.footer, string][]
          ).map(([key, href]) => (
            <Link
              key={href}
              href={href}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t.footer[key] as string}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-gray-300">
          © {new Date().getFullYear()} {t.common.appName} · {t.footer.rights}
        </p>
        <p className="text-xs text-gray-300">{t.footer.dataBy}</p>
        <p className="text-xs text-gray-300">{t.footer.notMedical}</p>
      </div>
    </footer>
  );
}
