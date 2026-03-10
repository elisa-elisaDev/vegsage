import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { legalConfig } from "@/lib/legalConfig";
import Link from "next/link";

export default async function TermsPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);
  const { CONTACT_EMAIL, GOVERNING_LAW, OPERATOR_NAME, LAST_UPDATED } = legalConfig;
  const lt = t.legal.terms;

  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1>{lt.title}</h1>
      <p className="text-gray-400 text-xs not-prose">
        {t.legal.lastUpdated}: {LAST_UPDATED} · {OPERATOR_NAME}
      </p>

      <p>{lt.intro}</p>

      <h2>{lt.acceptanceTitle}</h2>
      <p>{lt.acceptance}</p>

      <h2>{lt.serviceTitle}</h2>
      <p>{lt.service}</p>

      <h2>{lt.healthTitle}</h2>
      <p><strong>{lt.health}</strong></p>

      <h2>{lt.paymentTitle}</h2>
      <p>
        {lt.payment}{" "}
        <a href="https://www.paddle.com/legal/buyer-terms" target="_blank" rel="noopener noreferrer">
          Paddle Buyer Terms
        </a>
        {". "}
        <Link href="/legal/refunds">{t.footer.refunds}</Link>.
      </p>

      <h2>{lt.ipTitle}</h2>
      <p>{lt.ip}</p>

      <h2>{lt.liabilityTitle}</h2>
      <p>{lt.liability}</p>
      <p>{lt.liabilityData}</p>

      <h2>{lt.terminationTitle}</h2>
      <p>{lt.termination}</p>

      <h2>{lt.lawTitle}</h2>
      <p>{lt.law} <strong>{GOVERNING_LAW}</strong>.</p>

      <h2>{lt.contactTitle}</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </article>
  );
}
