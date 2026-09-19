import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_CONTENT } from "@/lib/content/legal";
import { DICTIONARIES } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function TermsPage() {
  const locale = await getServerLocale();
  return <LegalPage doc={LEGAL_CONTENT[locale].terms} dict={DICTIONARIES[locale]} />;
}
