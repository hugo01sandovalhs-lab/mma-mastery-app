"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICTIONARIES, formatT, isLocale, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "mma-mastery-locale";
type Vars = Record<string, string | number>;
type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: string, fallback?: string, vars?: Vars) => string };
const I18nContext = createContext<I18nValue>({ locale: "fr", setLocale: () => undefined, t: (key, fallback = "") => fallback || key });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("fr");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isLocale(saved)) {
      setLocale(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const selectLocale = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);

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
