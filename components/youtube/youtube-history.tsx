"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "mma-mastery-youtube-history";
const MAX_ENTRIES = 8;

export function YouTubeHistory({ currentQuery }: { currentQuery: string }) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    let stored: string[] = [];
    try {
      stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      stored = [];
    }

    if (currentQuery.trim()) {
      stored = [currentQuery.trim(), ...stored.filter((q) => q !== currentQuery.trim())].slice(0, MAX_ENTRIES);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } catch {
        // ignore storage errors (private browsing, quota)
      }
    }

    setHistory(stored);
  }, [currentQuery]);

  if (history.length === 0) return null;

  return (
    <div className="youtube-history">
      {history.map((query) => (
        <Link key={query} href={`/youtube?q=${encodeURIComponent(query)}`}>
          {query}
        </Link>
      ))}
    </div>
  );
}
