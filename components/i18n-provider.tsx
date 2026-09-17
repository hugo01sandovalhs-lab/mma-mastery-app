"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICTIONARIES, isLocale, type Locale } from "@/lib/i18n";

const STORAGE_KEY = "mma-mastery-locale";
type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: string, fallback?: string) => string };
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
    t: (key: string, fallback = "") => DICTIONARIES[locale][key as keyof typeof DICTIONARIES.fr] ?? fallback,
  }), [locale, selectLocale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n() {
  return useContext(I18nContext);
}
