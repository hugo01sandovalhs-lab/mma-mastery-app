"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleQuestion, Search as SearchIcon, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { quickSearch } from "@/lib/usecases/quick-search-actions";
import type { SearchResult, SearchResultType } from "@/lib/usecases/search-actions";

const TYPE_LABEL_KEYS: Record<SearchResultType, string> = {
  navigation: "search.type.navigation",
  coach: "search.type.coach",
  skill: "search.type.skill",
  resource: "search.type.resource",
  session: "search.type.session",
  observation: "search.type.observation",
  goal: "search.type.goal",
  video: "search.type.video",
};

const DEBOUNCE_MS = 250;

/**
 * Global command-palette-style quick search: Cmd/Ctrl+K from anywhere opens
 * an overlay wired to the exact same `search()` usecase as `/search` (via a
 * thin Server Action wrapper) — no parallel search logic, just a faster way
 * to reach it. `/search` itself stays the full-page destination for
 * browsing history/prompts/results at leisure.
 */
export function CommandPalette() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
    else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      quickSearch(trimmed)
        .then((r) => setResults(r))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  function go(r: SearchResult) {
    setOpen(false);
    if (r.type === "video") window.open(r.href, "_blank", "noreferrer");
    else router.push(r.href);
  }

  function viewAll() {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="min-h-11 min-w-11"
        aria-label={t("commandPalette.open")}
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[18%] max-h-[70vh] translate-y-0 overflow-y-auto sm:max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="sr-only">{t("commandPalette.open")}</DialogTitle>
          </DialogHeader>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.inputAria")}
            className="w-full border-b border-border bg-transparent px-1 pb-3 text-base outline-none placeholder:text-muted-foreground"
          />

          {query.trim().length >= 2 && !loading && results.length === 0 ? (
            <p className="px-1 py-4 text-sm text-muted-foreground">
              {t("search.noResults", "", { query: query.trim() })}
            </p>
          ) : null}

          {results.length > 0 ? (
            <ul className="flex flex-col gap-1 py-1">
              {results.map((r) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => go(r)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted"
                  >
                    {r.type === "video" ? <Video className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                    {r.type === "coach" ? <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                    <Badge variant="outline" className="mt-0.5 shrink-0">{t(TYPE_LABEL_KEYS[r.type])}</Badge>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{r.title}</span>
                      {r.detail ? <span className="truncate text-xs text-muted-foreground">{r.detail}</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {query.trim().length >= 2 ? (
            <button
              type="button"
              onClick={viewAll}
              className="mt-1 self-start px-1 text-xs font-medium text-primary hover:underline"
            >
              {t("commandPalette.viewAll")}
            </button>
          ) : (
            <p className="px-1 pt-3 text-xs text-muted-foreground">{t("commandPalette.hint")}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
