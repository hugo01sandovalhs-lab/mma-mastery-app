import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { normalizeSearchQuery } from "@/lib/usecases/search-actions";

describe("normalizeSearchQuery", () => {
  it.each([
    ["Comment faire un armbar ?", "armbar"],
    ["Qu'est-ce que l'open guard ?", "open guard"],
    ["Comment maîtriser le double leg", "double leg"],
    ["Quelles sont les erreurs les plus courantes en jab ?", "jab"],
  ])("turns a guided question into searchable terms", (question, expected) => {
    expect(normalizeSearchQuery(question)).toBe(expected);
  });
});
