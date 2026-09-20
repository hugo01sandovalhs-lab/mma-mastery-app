import { describe, expect, it, vi } from "vitest";

/**
 * getTechniqueOfTheDay() was rewritten to reuse the exact same
 * evidence-based triggers as Training Intelligence (`evaluateSkill`) instead
 * of a pure "untouched skill, day-of-year index" pick, and to never
 * re-surface a mastered skill. loadSkillIntelligenceInputs is mocked
 * directly (rather than the underlying Supabase queries) since it's a
 * separate, already-tested usecase.
 */

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: vi.fn(),
}));

const CATALOG = [
  { id: "skill-armbar", name: "Armbar", slug: "armbar", category: "submission", discipline_id: "disc-1", discipline: { id: "disc-1", code: "grappling", name: "Grappling" } },
  { id: "skill-sprawl", name: "Sprawl", slug: "sprawl", category: "defense", discipline_id: "disc-1", discipline: { id: "disc-1", code: "grappling", name: "Grappling" } },
];

vi.mock("@/lib/infra/db/supabase-service", () => ({
  createPublicClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(async () => ({ data: CATALOG, error: null })),
      })),
    })),
  })),
}));

const loadSkillIntelligenceInputs = vi.fn();
vi.mock("@/lib/usecases/training-intelligence-actions", () => ({ loadSkillIntelligenceInputs }));

const NOW = new Date("2024-06-01T00:00:00Z");

describe("getTechniqueOfTheDay", () => {
  it("picks the skill with the strongest evidence-based trigger and reuses its Training Intelligence reason", async () => {
    loadSkillIntelligenceInputs.mockResolvedValue([
      {
        skillId: "skill-armbar",
        skillName: "Armbar",
        progress: { knowledge_level: 1, drilling_reps: 0, live_application_count: 0, sparring_attempt_count: 0, sparring_success_count: 0, consistency_score: null, pressure_performance_level: null, confidence_level: null, evidence_count: 1, last_practiced_at: null },
        observations: [{ type: "difficulty", content: "Can't finish from mount", occurredAt: "2024-05-30" }],
        lastPracticedAt: null,
        prerequisiteNames: [],
      },
    ]);

    const { getTechniqueOfTheDay } = await import("@/lib/usecases/skill-actions");
    const pick = await getTechniqueOfTheDay(NOW);

    expect(pick).toMatchObject({ id: "skill-armbar", isExploratory: false, reasonKey: "trainingIntel.difficulty.reason" });
  });

  it("falls back to an exploratory pick when no skill has evidence, and never invents a reason", async () => {
    loadSkillIntelligenceInputs.mockResolvedValue([]);

    const { getTechniqueOfTheDay } = await import("@/lib/usecases/skill-actions");
    const pick = await getTechniqueOfTheDay(NOW);

    expect(pick?.isExploratory).toBe(true);
    expect(pick?.reasonKey).toBe("skills.techniqueOfDay.exploratoryReason");
  });

  it("degrades to an exploratory pick instead of losing the catalog when intelligence inputs fail to load", async () => {
    loadSkillIntelligenceInputs.mockRejectedValue(new Error("network error"));

    const { getTechniqueOfTheDay } = await import("@/lib/usecases/skill-actions");
    const pick = await getTechniqueOfTheDay(NOW);

    expect(pick).not.toBeNull();
    expect(pick?.isExploratory).toBe(true);
  });

  it("never re-surfaces a mastered skill", async () => {
    loadSkillIntelligenceInputs.mockResolvedValue([
      {
        skillId: "skill-armbar",
        skillName: "Armbar",
        progress: { knowledge_level: 4, drilling_reps: 20, live_application_count: 5, sparring_attempt_count: 10, sparring_success_count: 8, consistency_score: 0.9, pressure_performance_level: 4, confidence_level: 4, evidence_count: 20, last_practiced_at: "2024-05-31" },
        observations: [],
        lastPracticedAt: "2024-05-31",
        prerequisiteNames: [],
      },
    ]);

    const { getTechniqueOfTheDay } = await import("@/lib/usecases/skill-actions");
    const pick = await getTechniqueOfTheDay(NOW);

    expect(pick?.id).toBe("skill-sprawl");
    expect(pick?.isExploratory).toBe(true);
  });
});
