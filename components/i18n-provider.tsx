"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "mma-mastery-locale";
type Vars = Record<string, string | number>;
type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: string, fallback?: string, vars?: Vars) => string };
const I18nContext = createContext<I18nValue>({ locale: "fr", setLocale: () => undefined, t: (key, fallback = "") => fallback || key });

/**
 * The `locale` cookie (read server-side via getServerLocale) is the single
 * source of truth. `initialLocale` must be seeded from that same cookie by
 * the server root layout so client hydration never diverges from what
 * server components already rendered.
 */
export function I18nProvider({ children, initialLocale = "fr" }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const router = useRouter();

  const selectLocale = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    document.cookie = `${STORAGE_KEY}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    // Server components (dashboard, etc.) read the locale from the cookie.
    // Router-cached RSC payloads were rendered under the old locale, so a
    // refresh is required or navigating to an already-prefetched route would
    // show stale-language content.
    router.refresh();
  }, [router]);

  const value = useMemo(() => ({
    locale,
    setLocale: selectLocale,
    t: (key: string, fallback = "", vars?: Vars) => {
      const template = DICTIONARIES[locale][key as keyof typeof DICTIONARIES.fr] ?? fallback;
      return vars ? formatT(template, vars) : template;
    },
  }), [locale, selectLocale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/**
 * Inline translated fragment for use inside server components (which can't
 * call useI18n directly): `<T k="page.x" fallback="…" />` in server JSX.
 */
export function T({ k, fallback = "", vars }: { k: string; fallback?: string; vars?: Vars }) {
  const { t } = useI18n();
  return t(k, fallback, vars);
}
