import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { legalConfig } from "@/lib/legalConfig";

export default async function RefundsPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);
  const { CONTACT_EMAIL, LAST_UPDATED } = legalConfig;
  const lr = t.legal.refunds;

  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1>{lr.title}</h1>
      <p className="text-gray-400 text-xs not-prose">
        {t.legal.lastUpdated}: {LAST_UPDATED}
      </p>

      <p>{lr.intro}</p>

      <h2>{lr.eligibilityTitle}</h2>
      <p>{lr.eligibility}</p>

      <h2>{lr.howTitle}</h2>
      <p>
        {lr.how}{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>{lr.cancelTitle}</h2>
      <p>{lr.cancel}</p>
    </article>
  );
}
