import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";
import { legalConfig } from "@/lib/legalConfig";

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);
  const { CONTACT_EMAIL, OPERATOR_NAME, OPERATOR_ADDRESS, LAST_UPDATED } = legalConfig;
  const lp = t.legal.privacy;

  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1>{lp.title}</h1>
      <p className="text-gray-400 text-xs not-prose">
        {t.legal.lastUpdated}: {LAST_UPDATED} · {OPERATOR_NAME}
      </p>

      <p>{lp.intro}</p>

      <h2>{lp.controllerTitle}</h2>
      <p>{OPERATOR_NAME}{OPERATOR_ADDRESS ? ` — ${OPERATOR_ADDRESS}` : ""}</p>

      <h2>{lp.dataTitle}</h2>
      <p>{lp.data}</p>

      <h2>{lp.purposeTitle}</h2>
      <p>{lp.purpose}</p>

      <h2>{lp.recipientsTitle}</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — Auth &amp; Database.{" "}
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </li>
        <li>
          <strong>Paddle</strong> — Payment processing.{" "}
          <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </li>
        <li>
          <strong>USDA FoodData Central</strong> — Food data queries (search term only, no personal data sent).
        </li>
      </ul>
      <p>{lp.hosting}</p>

      <h2>{lp.rightsTitle}</h2>
      <p>
        {lp.rights}{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p>{lp.deletion}</p>

      <h2>{lp.retentionTitle}</h2>
      <p>{lp.retention}</p>

      <h2>{lp.cookiesTitle}</h2>
      <p>{lp.cookies}</p>

      <h2>{lp.contactTitle}</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </article>
  );
}
