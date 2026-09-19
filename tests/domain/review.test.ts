import { describe, expect, it } from "vitest";
import type { SkillProgressDimensions } from "@/lib/domain/skill";
import { buildReviewQueue, buildWeeklyReviewDigest, findLastResolvedDifficulty } from "@/lib/domain/review";
import type { SkillIntelligenceInput } from "@/lib/domain/training-intelligence";

const NOW = new Date("2026-09-14T12:00:00.000Z");

const baseProgress: SkillProgressDimensions = {
  knowledge_level: 0,
  drilling_reps: 0,
  live_application_count: 0,
  sparring_attempt_count: 0,
  sparring_success_count: 0,
  consistency_score: null,
  pressure_performance_level: null,
  confidence_level: null,
  evidence_count: 0,
  last_practiced_at: null,
};

function skillInput(overrides: Partial<SkillIntelligenceInput> = {}): SkillIntelligenceInput {
  return {
    skillId: "skill-1",
    skillName: "Double Leg",
    progress: baseProgress,
    observations: [],
    lastPracticedAt: null,
    prerequisiteNames: [],
    ...overrides,
  };
}

function daysAgo(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe("buildReviewQueue", () => {
  it("returns an empty list when there is no data", () => {
    expect(buildReviewQueue([], NOW)).toEqual([]);
  });

  it("surfaces a recent unresolved question", () => {
    const result = buildReviewQueue(
      [skillInput({ observations: [{ type: "question", content: "Timing?", occurredAt: daysAgo(2) }] })],
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("question");
    expect(result[0].detailVars.content).toContain("Timing?");
  });

  it("surfaces a recent difficulty", () => {
    const result = buildReviewQueue(
      [skillInput({ observations: [{ type: "difficulty", content: "Genou", occurredAt: daysAgo(1) }] })],
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("difficulty");
  });

  it("ignores questions/difficulties outside the recency window", () => {
    const result = buildReviewQueue(
      [skillInput({ observations: [{ type: "question", content: "Old", occurredAt: daysAgo(90) }] })],
      NOW,
    );
    expect(result).toHaveLength(0);
  });

  it("surfaces a skill not practiced beyond the stale threshold", () => {
    const result = buildReviewQueue([skillInput({ lastPracticedAt: daysAgo(30) })], NOW);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("stale");
  });

  it("surfaces a developing skill with no practice session at all", () => {
    const result = buildReviewQueue(
      [skillInput({ progress: { ...baseProgress, knowledge_level: 2 }, lastPracticedAt: null })],
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("developing");
  });

  it("surfaces a skill drilled a lot but never applied live or in sparring", () => {
    const result = buildReviewQueue(
      [skillInput({ progress: { ...baseProgress, drilling_reps: 10 }, lastPracticedAt: daysAgo(1) })],
      NOW,
    );
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("never_applied");
  });

  it("does not flag never_applied once a skill has a live or sparring attempt", () => {
    const result = buildReviewQueue(
      [
        skillInput({
          progress: { ...baseProgress, drilling_reps: 10, live_application_count: 1 },
          lastPracticedAt: daysAgo(1),
        }),
      ],
      NOW,
    );
    expect(result.filter((r) => r.type === "never_applied")).toHaveLength(0);
  });

  it("does not flag a skill that is regularly practiced and mastered", () => {
    const result = buildReviewQueue(
      [
        skillInput({
          progress: { ...baseProgress, knowledge_level: 4, sparring_attempt_count: 10, sparring_success_count: 9 },
          lastPracticedAt: daysAgo(2),
        }),
      ],
      NOW,
    );
    expect(result).toHaveLength(0);
  });

  it("caps items per type so one noisy skill cannot crowd the list", () => {
    const inputs = Array.from({ length: 8 }, (_, i) =>
      skillInput({
        skillId: `skill-${i}`,
        skillName: `Skill ${i}`,
        observations: [{ type: "question", content: "x", occurredAt: daysAgo(i) }],
      }),
    );
    const result = buildReviewQueue(inputs, NOW, 5);
    expect(result.filter((r) => r.type === "question")).toHaveLength(5);
  });

  it("is deterministic for the same input", () => {
    const inputs = [skillInput({ lastPracticedAt: daysAgo(30) })];
    expect(buildReviewQueue(inputs, NOW)).toEqual(buildReviewQueue(inputs, NOW));
  });
});

describe("buildWeeklyReviewDigest", () => {
  it("returns zero counts when there is no data", () => {
    expect(buildWeeklyReviewDigest([], NOW)).toEqual({
      skillsTouchedCount: 0,
      questionCount: 0,
      difficultyCount: 0,
    });
  });

  it("counts only observations within the last 7 days", () => {
    const inputs = [
      skillInput({
        observations: [
          { type: "question", content: "recent", occurredAt: daysAgo(2) },
          { type: "difficulty", content: "recent", occurredAt: daysAgo(6) },
          { type: "difficulty", content: "old", occurredAt: daysAgo(10) },
        ],
      }),
    ];
    expect(buildWeeklyReviewDigest(inputs, NOW)).toEqual({
      skillsTouchedCount: 1,
      questionCount: 1,
      difficultyCount: 1,
    });
  });

  it("counts distinct skills touched, not observation count", () => {
    const inputs = [
      skillInput({
        skillId: "a",
        observations: [{ type: "question", content: "x", occurredAt: daysAgo(1) }],
      }),
      skillInput({
        skillId: "b",
        observations: [
          { type: "question", content: "x", occurredAt: daysAgo(1) },
          { type: "difficulty", content: "y", occurredAt: daysAgo(2) },
        ],
      }),
    ];
    expect(buildWeeklyReviewDigest(inputs, NOW).skillsTouchedCount).toBe(2);
  });
});

describe("findLastResolvedDifficulty", () => {
  it("returns null when there is no data", () => {
    expect(findLastResolvedDifficulty([], NOW)).toBeNull();
  });

  it("ignores a difficulty still inside the active review window", () => {
    const inputs = [
      skillInput({ observations: [{ type: "difficulty", content: "x", occurredAt: daysAgo(5) }] }),
    ];
    expect(findLastResolvedDifficulty(inputs, NOW)).toBeNull();
  });

  it("surfaces a difficulty that has aged out with no newer recurrence", () => {
    const inputs = [
      skillInput({ observations: [{ type: "difficulty", content: "guard pass", occurredAt: daysAgo(40) }] }),
    ];
    const result = findLastResolvedDifficulty(inputs, NOW);
    expect(result?.skillId).toBe("skill-1");
    expect(result?.detailVars.content).toBe("guard pass");
  });

  it("picks the most recently aged-out difficulty across skills", () => {
    const inputs = [
      skillInput({ skillId: "a", observations: [{ type: "difficulty", content: "older", occurredAt: daysAgo(60) }] }),
      skillInput({ skillId: "b", observations: [{ type: "difficulty", content: "newer", occurredAt: daysAgo(31) }] }),
    ];
    expect(findLastResolvedDifficulty(inputs, NOW)?.skillId).toBe("b");
  });

  it("is deterministic for the same input", () => {
    const inputs = [skillInput({ observations: [{ type: "difficulty", content: "x", occurredAt: daysAgo(40) }] })];
    expect(findLastResolvedDifficulty(inputs, NOW)).toEqual(findLastResolvedDifficulty(inputs, NOW));
  });
});
