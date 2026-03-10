import { cookies } from "next/headers";
import { getLocaleFromCookie, getT, LOCALE_COOKIE } from "@/lib/i18n";

export default async function DataSourcesPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getT(locale);
  const ld = t.legal.dataSources;

  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1>{ld.title}</h1>

      <h2>{ld.fdcTitle}</h2>
      <p>{ld.offDesc}</p>
      <p>{ld.usage}</p>
    </article>
  );
}
