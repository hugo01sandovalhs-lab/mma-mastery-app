import "server-only";
import { cookies } from "next/headers";
import { DICTIONARIES, formatT, isLocale, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "mma-mastery-locale";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(STORAGE_KEY)?.value;
  return value && isLocale(value) ? value : "fr";
}

/** Translate a string inside a server action, where there's no I18nProvider context. */
export async function tServer(key: keyof typeof DICTIONARIES.fr, fallback: string, vars?: Record<string, string | number>): Promise<string> {
  const locale = await getServerLocale();
  const template = DICTIONARIES[locale][key] ?? fallback;
  return vars ? formatT(template, vars) : template;
}
