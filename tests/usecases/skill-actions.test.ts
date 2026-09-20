import { describe, expect, it, vi } from "vitest";

/**
 * Regression test for the production /skills crash: getSkills() used to
 * `throw new Error(progressError.message)` when the per-user skill_progress
 * enrichment query failed, and /skills's page.tsx (unlike every other caller
 * — /study, /goals, /coach) awaited it unguarded, so a transient failure on
 * that secondary, per-user query took down the whole catalog page. The
 * catalog itself (the primary data) must still return; per-user progress
 * degrades to "unknown" instead of throwing.
 */

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: vi.fn(),
}));

const CATALOG = [
  {
    id: "skill-1",
    name: "Armbar",
    slug: "armbar",
    category: "submission",
    discipline_id: "disc-1",
    discipline: { id: "disc-1", code: "grappling", name: "Grappling" },
  },
];

vi.mock("@/lib/infra/db/supabase-service", () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(async () => ({ data: CATALOG, error: null })),
      })),
    })),
  })),
}));

vi.mock("@/lib/infra/db/supabase-server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(async () => ({
          data: null,
          error: { message: "connection terminated unexpectedly" },
        })),
      })),
    })),
  })),
}));

describe("getSkills degrades secondary per-user progress instead of crashing the catalog", () => {
  it("returns the full catalog with stage 'unknown' when skill_progress fails", async () => {
    const { getSkills } = await import("@/lib/usecases/skill-actions");

    const skills = await getSkills();

    expect(skills).toHaveLength(1);
    expect(skills[0]).toMatchObject({ id: "skill-1", name: "Armbar", stage: "unknown", lastPracticedAt: null });
  });
});
