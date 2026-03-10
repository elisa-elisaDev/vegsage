import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { legalConfig } from "@/lib/legalConfig";

export default async function ContactPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);
  const { CONTACT_EMAIL, OPERATOR_NAME, OPERATOR_ADDRESS, OPERATOR_COUNTRY } = legalConfig;
  const lc = t.legal.contact;

  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1>{lc.title}</h1>

      <h2>{lc.generalTitle}</h2>
      <p>{lc.general}</p>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>{lc.legalTitle}</h2>
      <p>
        {lc.legal}{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>{lc.billingTitle}</h2>
      <p>
        {lc.billing}{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>{lc.operatorTitle}</h2>
      <address className="not-italic">
        {OPERATOR_NAME && <p>{OPERATOR_NAME}</p>}
        {OPERATOR_ADDRESS && <p>{OPERATOR_ADDRESS}</p>}
        {OPERATOR_COUNTRY && <p>{OPERATOR_COUNTRY}</p>}
      </address>
    </article>
  );
}
