import { describe, expect, it, vi } from "vitest";

/**
 * Regression test for a real bug found during the reliability pass: several
 * create* server actions returned the raw Postgres/Supabase error message
 * (e.g. "duplicate key value violates unique constraint ...") directly as
 * `state.error`, which forms render verbatim with `role="alert"`. That
 * leaks backend implementation detail to users instead of a recoverable,
 * localized message. Fixed by routing DB-insert failures through
 * `tServer("error.saveFailed", ...)`, same as the existing Zod
 * validation-error path already did.
 */

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

const RAW_DB_ERROR = 'duplicate key value violates unique constraint "goals_pkey"';

const insertMock = vi.fn(async () => ({ error: { message: RAW_DB_ERROR } }));
vi.mock("@/lib/infra/db/supabase-server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } } )) },
    from: vi.fn(() => ({ insert: insertMock })),
  })),
}));

describe("save-failure fallback never leaks the raw DB error to the user", () => {
  it("createGoal (goals route)", async () => {
    const { createGoal } = await import("@/lib/usecases/goals-actions");
    const fd = new FormData();
    fd.set("horizon", "short");
    fd.set("title", "Progresser au guard");

    const result = await createGoal({ error: null }, fd);

    expect(result.error).toBe("Impossible d'enregistrer pour le moment. Réessayez dans un instant.");
    expect(result.error).not.toContain("constraint");
    expect(result.error).not.toContain("goals_pkey");
  });

  it("createResource (study route)", async () => {
    const { createResource } = await import("@/lib/usecases/knowledge-actions");
    const fd = new FormData();
    fd.set("type", "video");
    fd.set("title", "Armbar breakdown");
    fd.set("url", "https://example.com/video");

    const result = await createResource({ error: null }, fd);

    expect(result.error).toBe("Impossible d'enregistrer pour le moment. Réessayez dans un instant.");
    expect(result.error).not.toContain("constraint");
  });

  it("createSkillNote (skills route)", async () => {
    const { createSkillNote } = await import("@/lib/usecases/knowledge-actions");
    const fd = new FormData();
    fd.set("skill_id", "11111111-1111-4111-8111-111111111111");
    fd.set("content", "Watch out for the frame before the sweep.");

    const result = await createSkillNote({ error: null }, fd);

    expect(result.error).toBe("Impossible d'enregistrer pour le moment. Réessayez dans un instant.");
    expect(result.error).not.toContain("constraint");
  });

  it("createMatch (competition route)", async () => {
    const { createMatch } = await import("@/lib/usecases/competition-actions");
    const fd = new FormData();
    fd.set("discipline_id", "22222222-2222-4222-8222-222222222222");
    fd.set("date", "2026-09-20");

    const result = await createMatch({ error: null }, fd);

    expect(result.error).toBe("Impossible d'enregistrer pour le moment. Réessayez dans un instant.");
    expect(result.error).not.toContain("constraint");
  });
});
