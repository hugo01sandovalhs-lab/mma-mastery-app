"use client";

import { useI18n } from "@/components/i18n-provider";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="sr-only">{t("language.label", "Langue")}</span>
      <select
        aria-label={t("language.label", "Langue")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="h-8 rounded-md border border-border bg-background px-2 font-semibold uppercase text-foreground"
      >
        {LOCALES.map((item) => <option key={item} value={item}>{t(`language.${item}`, item.toUpperCase())}</option>)}
      </select>
    </label>
  );
}
