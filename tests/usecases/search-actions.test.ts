import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

const CATALOG = [
  { id: "skill-arm-drag", name: "Arm Drag", slug: "arm-drag", category: "control", discipline_id: "disc-1", discipline: { id: "disc-1", code: "grappling", name: "Grappling" } },
  { id: "skill-sprawl", name: "Sprawl", slug: "sprawl", category: "defense", discipline_id: "disc-1", discipline: { id: "disc-1", code: "wrestling", name: "Wrestling" } },
  { id: "skill-guard", name: "Guard", slug: "guard", category: "position", discipline_id: "disc-1", discipline: { id: "disc-1", code: "grappling", name: "Grappling" } },
];

const getSkillsCatalog = vi.fn(async () => CATALOG);
vi.mock("@/lib/usecases/skill-actions", () => ({ getSkillsCatalog: () => getSkillsCatalog() }));

const searchTechniqueVideos = vi.fn(async () => [
  { videoId: "v1", title: "Sprawl breakdown", channelTitle: "Coach", url: "https://youtube.com/watch?v=v1", thumbnail: "" },
]);
vi.mock("@/lib/usecases/video-search-actions", () => ({ searchTechniqueVideos: () => searchTechniqueVideos() }));

/** Chainable, thenable stand-in for a Supabase query builder — resolves whatever `result` the test configured for that table. */
function makeBuilder(result: { data: unknown[] | null; error: { message: string } | null }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    or: () => builder,
    ilike: () => builder,
    limit: () => builder,
    then: (resolve: (r: typeof result) => void) => resolve(result),
  };
  return builder;
}

const tableResults: Record<string, { data: unknown[] | null; error: { message: string } | null }> = {};
function resetTableResults() {
  tableResults.resources = { data: [], error: null };
  tableResults.training_sessions = { data: [], error: null };
  tableResults.session_observations = { data: [], error: null };
  tableResults.goals = { data: [], error: null };
}
resetTableResults();

let authUser: { id: string } | null = { id: "user-1" };

vi.mock("@/lib/infra/db/supabase-server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: authUser } })) },
    from: vi.fn((table: string) => makeBuilder(tableResults[table] ?? { data: [], error: null })),
  })),
}));

import { normalizeSearchQuery, search } from "@/lib/usecases/search-actions";

beforeEach(() => {
  resetTableResults();
  authUser = { id: "user-1" };
  getSkillsCatalog.mockClear();
  getSkillsCatalog.mockResolvedValue(CATALOG);
  searchTechniqueVideos.mockClear();
});

describe("normalizeSearchQuery", () => {
  it.each([
    ["Comment faire un armbar ?", "armbar"],
    ["Qu'est-ce que l'open guard ?", "open guard"],
    ["Comment maîtriser le double leg", "double leg"],
    ["Quelles sont les erreurs les plus courantes en jab ?", "jab"],
  ])("turns a guided question into searchable terms (fr)", (question, expected) => {
    expect(normalizeSearchQuery(question)).toBe(expected);
  });

  it.each([
    ["How do I do an armbar?", "armbar"],
    ["What is the open guard?", "open guard"],
    ["How do I master the double leg?", "double leg"],
    ["What are the most common mistakes in the jab?", "jab"],
  ])("turns a guided question into searchable terms (en)", (question, expected) => {
    expect(normalizeSearchQuery(question, "en")).toBe(expected);
  });

  it.each([
    ["¿Cómo hacer un armbar?", "armbar"],
    ["¿Qué es la open guard?", "open guard"],
    ["¿Cómo dominar el double leg?", "double leg"],
  ])("turns a guided question into searchable terms (es)", (question, expected) => {
    expect(normalizeSearchQuery(question, "es")).toBe(expected);
  });

  it.each([
    ["Wie macht man einen Armbar?", "Armbar"],
    ["Was ist der Open Guard?", "Open Guard"],
    ["Wie meistert man den Double Leg?", "Double Leg"],
  ])("turns a guided question into searchable terms (de)", (question, expected) => {
    expect(normalizeSearchQuery(question, "de")).toBe(expected);
  });

  it.each([
    ["Как делать армбар?", "армбар"],
    ["Что такое открытая гвардия?", "открытая гвардия"],
  ])("turns a guided question into searchable terms (ru)", (question, expected) => {
    expect(normalizeSearchQuery(question, "ru")).toBe(expected);
  });

  it.each([
    ["アームバーのやり方は？", "アームバー"],
    ["オープンガードとは？", "オープンガード"],
    ["ダブルレッグを極めるには？", "ダブルレッグ"],
  ])("turns a guided question into searchable terms (ja)", (question, expected) => {
    expect(normalizeSearchQuery(question, "ja")).toBe(expected);
  });
});

/**
 * Regression coverage for the P0 "/search crashes on a real query" bug.
 * Root causes fixed:
 *  1. `getSkillsCatalog()` was awaited unguarded — a catalog failure crashed
 *     the whole route instead of just dropping skill matches.
 *  2. The per-user DB blocks (resources/sessions/observations/goals) threw
 *     on any Postgres error instead of degrading to a partial result set.
 *  3. The hand-built `.or()` filter string interpolated the raw query
 *     without PostgREST's required quoting, so a query containing a comma or
 *     parenthesis (both valid PostgREST filter syntax, common in real user
 *     input like "stand-up (boxing)") broke the query and threw.
 */
describe("search()", () => {
  it.each([
    "arm drag",
    "sprwal",
    "garde",
    "sprawl vidéo",
    "mes séances",
    "mes objectifs",
    "quoi travailler aujourd'hui",
  ])("never throws for %j", async (query) => {
    await expect(search(query)).resolves.toBeInstanceOf(Array);
  });

  it("matches an exact skill name", async () => {
    const results = await search("arm drag");
    expect(results.some((r) => r.type === "skill" && r.skillName === "Arm Drag")).toBe(true);
  });

  it("matches a skill through small typo tolerance", async () => {
    const results = await search("sprwal");
    expect(results.some((r) => r.type === "skill" && r.skillName === "Sprawl")).toBe(true);
  });

  it("matches an English-named skill through a French alias", async () => {
    const results = await search("garde");
    expect(results.some((r) => r.type === "skill" && r.skillName === "Guard")).toBe(true);
  });

  it("resolves a video intent alongside the skill match", async () => {
    const results = await search("sprawl vidéo");
    expect(searchTechniqueVideos).toHaveBeenCalled();
    expect(results.some((r) => r.type === "video")).toBe(true);
  });

  it.each([
    ["mes séances", "/training"],
    ["mes objectifs", "/goals"],
    ["quoi travailler aujourd'hui", "/coach"],
  ])("resolves the %j navigation intent to %s", async (query, href) => {
    const results = await search(query);
    expect(results.some((r) => r.type === "navigation" && r.href === href)).toBe(true);
  });

  it("degrades to no skill matches instead of crashing when the catalog fails to load", async () => {
    getSkillsCatalog.mockRejectedValue(new Error("catalog down"));
    await expect(search("arm drag")).resolves.toBeInstanceOf(Array);
  });

  it("degrades to a partial result instead of throwing when a DB block errors", async () => {
    tableResults.resources = { data: null, error: { message: "connection reset" } };
    const results = await search("arm drag");
    expect(results.some((r) => r.type === "resource")).toBe(false);
    expect(results.some((r) => r.type === "skill")).toBe(true);
  });

  it("does not break the PostgREST .or() filter on a query containing a comma or parentheses", async () => {
    tableResults.goals = {
      data: [{ id: "goal-1", title: "stand-up (boxing)", description: null, status: "active" }],
      error: null,
    };
    await expect(search("stand-up (boxing)")).resolves.toBeInstanceOf(Array);
  });

  it("returns an empty array for a signed-out user instead of throwing", async () => {
    authUser = null;
    await expect(search("arm drag")).resolves.toBeInstanceOf(Array);
  });
});
