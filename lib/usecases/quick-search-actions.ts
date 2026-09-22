"use server";

import { search, type SearchResult } from "./search-actions";

/** Thin Server Action wrapper so the command palette (client component) can call `search()` directly. */
export async function quickSearch(query: string): Promise<SearchResult[]> {
  return search(query);
}
