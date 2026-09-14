import { describe, expect, it } from "vitest";
import {
  computeMasteryStage,
  metricLevel,
  skillInputSchema,
  skillRelationInputSchema,
  summarizeSkillProgress,
  type SkillProgressDimensions,
} from "@/lib/domain/skill";

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

describe("computeMasteryStage", () => {
  it("returns unknown for a skill with no evidence", () => {
    expect(computeMasteryStage(baseProgress)).toBe("unknown");
  });

  it("returns introduced when knowledge_level is set", () => {
    expect(computeMasteryStage({ ...baseProgress, knowledge_level: 1 })).toBe("introduced");
  });

  it("returns introduced when there is evidence but no theory", () => {
    expect(computeMasteryStage({ ...baseProgress, evidence_count: 2 })).toBe("introduced");
  });

  it("returns drilling once drilling_reps reaches the threshold", () => {
    expect(computeMasteryStage({ ...baseProgress, knowledge_level: 1, drilling_reps: 5 })).toBe(
      "drilling",
    );
  });

  it("returns applying once live application or sparring is attempted", () => {
    expect(
      computeMasteryStage({ ...baseProgress, drilling_reps: 5, sparring_attempt_count: 1 }),
    ).toBe("applying");
  });

  it("returns consistent with a good sparring success ratio", () => {
    expect(
      computeMasteryStage({
        ...baseProgress,
        sparring_attempt_count: 5,
        sparring_success_count: 3,
      }),
    ).toBe("consistent");
  });

  it("does not return consistent below the attempt threshold", () => {
    expect(
      computeMasteryStage({
        ...baseProgress,
        sparring_attempt_count: 4,
        sparring_success_count: 4,
      }),
    ).toBe("applying");
  });

  it("returns mastered only with high volume, high ratio, and solid theory", () => {
    expect(
      computeMasteryStage({
        ...baseProgress,
        knowledge_level: 4,
        sparring_attempt_count: 10,
        sparring_success_count: 8,
      }),
    ).toBe("mastered");
  });

  it("does not claim mastered without sufficient theoretical knowledge", () => {
    expect(
      computeMasteryStage({
        ...baseProgress,
        knowledge_level: 1,
        sparring_attempt_count: 10,
        sparring_success_count: 9,
      }),
    ).toBe("consistent");
  });

  it("never divides by zero when there are no sparring attempts", () => {
    expect(() => computeMasteryStage({ ...baseProgress, sparring_success_count: 0 })).not.toThrow();
  });
});

describe("skillInputSchema", () => {
  const valid = {
    discipline_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    name: "Double Leg",
    slug: "double-leg",
    category: "takedown",
  };

  it("accepts a valid skill", () => {
    expect(skillInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    expect(skillInputSchema.safeParse({ ...valid, slug: "Double Leg!" }).success).toBe(false);
  });

  it("rejects a missing name", () => {
    expect(skillInputSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });
});

describe("skillRelationInputSchema", () => {
  const a = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
  const b = "4fa85f64-5717-4562-b3fc-2c963f66afa6";

  it("accepts a valid relation between two distinct skills", () => {
    expect(
      skillRelationInputSchema.safeParse({
        from_skill_id: a,
        to_skill_id: b,
        relation_type: "prerequisite",
      }).success,
    ).toBe(true);
  });

  it("rejects a self-relation", () => {
    expect(
      skillRelationInputSchema.safeParse({
        from_skill_id: a,
        to_skill_id: a,
        relation_type: "related",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid relation_type", () => {
    expect(
      skillRelationInputSchema.safeParse({
        from_skill_id: a,
        to_skill_id: b,
        relation_type: "friendship",
      }).success,
    ).toBe(false);
  });
});

describe("metricLevel", () => {
  it("returns none for zero", () => {
    expect(metricLevel(0, 5)).toBe("none");
  });

  it("returns none for null", () => {
    expect(metricLevel(null, 5)).toBe("none");
  });

  it("returns low below the available threshold", () => {
    expect(metricLevel(2, 5)).toBe("low");
  });

  it("returns available at the threshold", () => {
    expect(metricLevel(5, 5)).toBe("available");
  });

  it("returns available above the threshold", () => {
    expect(metricLevel(9, 5)).toBe("available");
  });
});

describe("summarizeSkillProgress", () => {
  it("returns an empty summary with no fabricated data when there are no skills", () => {
    expect(summarizeSkillProgress([])).toEqual({
      totalTracked: 0,
      stageCounts: {},
      disciplines: [],
    });
  });

  it("buckets each skill under its actual computed stage, never a stored one", () => {
    const summary = summarizeSkillProgress([
      { progress: baseProgress, disciplineName: "MMA" },
      { progress: { ...baseProgress, knowledge_level: 1 }, disciplineName: "MMA" },
      { progress: { ...baseProgress, drilling_reps: 5, knowledge_level: 1 }, disciplineName: "Jiu-Jitsu" },
    ]);

    expect(summary.totalTracked).toBe(3);
    expect(summary.stageCounts).toEqual({ unknown: 1, introduced: 1, drilling: 1 });
  });

  it("counts skills per discipline and sorts disciplines by count descending", () => {
    const summary = summarizeSkillProgress([
      { progress: baseProgress, disciplineName: "MMA" },
      { progress: baseProgress, disciplineName: "MMA" },
      { progress: baseProgress, disciplineName: "Boxe" },
    ]);

    expect(summary.disciplines).toEqual([
      { name: "MMA", count: 2 },
      { name: "Boxe", count: 1 },
    ]);
  });

  it("omits a skill from the discipline breakdown when its discipline is unknown", () => {
    const summary = summarizeSkillProgress([{ progress: baseProgress, disciplineName: null }]);
    expect(summary.totalTracked).toBe(1);
    expect(summary.disciplines).toEqual([]);
  });
});
