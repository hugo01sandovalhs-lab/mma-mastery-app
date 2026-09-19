"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

const STORAGE_KEY = "mma-mastery-search-history";
const MAX_ENTRIES = 8;

function readHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (private mode, disabled storage) — history simply won't persist.
  }
}

export function SearchHistory({ currentQuery }: { currentQuery: string }) {
  const { t } = useI18n();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    const trimmed = currentQuery.trim();
    if (trimmed.length < 2) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_ENTRIES);
      writeHistory(next);
      return next;
    });
  }, [currentQuery]);

  if (history.length === 0) return null;

  return (
    <div className="search-history" aria-label={t("search.history", "Recherches récentes")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">{t("search.history", "Recherches récentes")}</span>
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => {
            setHistory([]);
            writeHistory([]);
          }}
        >
          {t("search.clearHistory", "Effacer l’historique")}
        </button>
      </div>
      <div className="search-prompts" aria-label={t("search.history", "Recherches récentes")}>
        {history.map((entry) => (
          <Link key={entry} href={`/search?q=${encodeURIComponent(entry)}`}>
            {entry}
          </Link>
        ))}
      </div>
    </div>
  );
}
