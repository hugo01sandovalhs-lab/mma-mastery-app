import { describe, expect, it } from "vitest";
import type { SkillProgressDimensions } from "@/lib/domain/skill";
import {
  buildTrainingIntelligence,
  buildTrainingPlanSuggestion,
  MAX_RECOMMENDATIONS,
  type SkillIntelligenceInput,
} from "@/lib/domain/training-intelligence";

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

describe("buildTrainingIntelligence", () => {
  it("returns insufficient_data when there is no data at all", () => {
    expect(buildTrainingIntelligence([], NOW)).toEqual({ status: "insufficient_data" });
  });

  it("returns insufficient_data for a skill with no evidence of any kind", () => {
    const result = buildTrainingIntelligence([skillInput()], NOW);
    expect(result.status).toBe("insufficient_data");
  });

  it("flags a skill with a recent difficulty observation", () => {
    const result = buildTrainingIntelligence(
      [
        skillInput({
          observations: [{ type: "difficulty", content: "Perd l'équilibre en finition", occurredAt: daysAgo(2) }],
        }),
      ],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].reasons.some((r) => r.key === "trainingIntel.difficulty.reason")).toBe(true);
  });

  it("flags a recurring difficulty separately from a single one", () => {
    const result = buildTrainingIntelligence(
      [
        skillInput({
          observations: [
            { type: "difficulty", content: "Perd l'équilibre", occurredAt: daysAgo(2) },
            { type: "difficulty", content: "Perd l'équilibre encore", occurredAt: daysAgo(10) },
          ],
        }),
      ],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(
      result.recommendations[0].reasons.some((r) => r.key === "trainingIntel.recurringDifficulty.reason"),
    ).toBe(true);
    expect(result.recommendations[0].reasons.find((r) => r.key === "trainingIntel.recurringDifficulty.reason")?.vars)
      .toEqual({ count: 2 });
  });

  it("flags a skill with a recent question", () => {
    const result = buildTrainingIntelligence(
      [
        skillInput({
          observations: [{ type: "question", content: "Comment gérer le sprawl ?", occurredAt: daysAgo(1) }],
        }),
      ],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.recommendations[0].reasons.some((r) => r.key === "trainingIntel.question.reason")).toBe(true);
  });

  it("flags heavy drilling with no live application as a potential priority", () => {
    const result = buildTrainingIntelligence(
      [skillInput({ progress: { ...baseProgress, drilling_reps: 10, live_application_count: 0 } })],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.recommendations[0].reasons.some((r) => r.key === "trainingIntel.liveTransfer.reason")).toBe(
      true,
    );
  });

  it("flags low sparring success once there are enough attempts", () => {
    const result = buildTrainingIntelligence(
      [skillInput({ progress: { ...baseProgress, sparring_attempt_count: 5, sparring_success_count: 1 } })],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.recommendations[0].reasons.some((r) => r.key === "trainingIntel.sparringLow.reason")).toBe(true);
  });

  it("does not draw a strong conclusion from a single 0/1 sparring attempt", () => {
    const result = buildTrainingIntelligence(
      [skillInput({ progress: { ...baseProgress, sparring_attempt_count: 1, sparring_success_count: 0 } })],
      NOW,
    );
    expect(result.status).toBe("insufficient_data");
  });

  it("gives low priority (no recommendation) to a regularly practiced, performing skill", () => {
    const result = buildTrainingIntelligence(
      [
        skillInput({
          progress: {
            ...baseProgress,
            knowledge_level: 4,
            sparring_attempt_count: 10,
            sparring_success_count: 9,
          },
          lastPracticedAt: daysAgo(2),
        }),
      ],
      NOW,
    );
    expect(result.status).toBe("insufficient_data");
  });

  it("combines multiple triggered signals into multiple reasons on one recommendation", () => {
    const result = buildTrainingIntelligence(
      [
        skillInput({
          observations: [{ type: "difficulty", content: "Bras trop tendu", occurredAt: daysAgo(3) }],
          progress: { ...baseProgress, drilling_reps: 10, live_application_count: 0 },
        }),
      ],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.recommendations[0].reasons.length).toBeGreaterThanOrEqual(2);
    expect(result.recommendations[0].priority).toBe("high");
  });

  it("carries prerequisite names as context without turning them into a diagnosis", () => {
    const result = buildTrainingIntelligence(
      [
        skillInput({
          observations: [{ type: "question", content: "Timing du niveau", occurredAt: daysAgo(1) }],
          prerequisiteNames: ["Level Change"],
        }),
      ],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.recommendations[0].prerequisiteContext).toEqual(["Level Change"]);
    expect(result.recommendations[0].reasons.some((r) => Object.values(r.vars).includes("Level Change"))).toBe(
      false,
    );
  });

  it("never returns more than the maximum number of recommendations", () => {
    const inputs = Array.from({ length: 6 }, (_, i) =>
      skillInput({
        skillId: `skill-${i}`,
        skillName: `Skill ${i}`,
        observations: [{ type: "difficulty", content: "x", occurredAt: daysAgo(1) }],
      }),
    );
    const result = buildTrainingIntelligence(inputs, NOW);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.recommendations.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
    expect(result.recommendations).toHaveLength(MAX_RECOMMENDATIONS);
  });

  it("is deterministic for the same input", () => {
    const inputs = [
      skillInput({
        observations: [{ type: "difficulty", content: "x", occurredAt: daysAgo(1) }],
      }),
    ];
    const a = buildTrainingIntelligence(inputs, NOW);
    const b = buildTrainingIntelligence(inputs, NOW);
    expect(a).toEqual(b);
  });

  it("never invents data: reasons only reference values present in the input", () => {
    const input = skillInput({
      observations: [{ type: "difficulty", content: "Genou qui lâche", occurredAt: daysAgo(1) }],
    });
    const result = buildTrainingIntelligence([input], NOW);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.recommendations[0].reasons[0].vars.content).toBe("Genou qui lâche");
  });
});

describe("buildTrainingPlanSuggestion", () => {
  it("returns insufficient_data when there is no data at all", () => {
    expect(buildTrainingPlanSuggestion([], NOW)).toEqual({ status: "insufficient_data" });
  });

  it("returns insufficient_data when no skill clears the recommendation threshold", () => {
    const result = buildTrainingPlanSuggestion([skillInput()], NOW);
    expect(result.status).toBe("insufficient_data");
  });

  it("classifies a recent difficulty as a REVIEW action", () => {
    const result = buildTrainingPlanSuggestion(
      [
        skillInput({
          observations: [{ type: "difficulty", content: "Perd l'équilibre", occurredAt: daysAgo(1) }],
        }),
      ],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.plan.actionType).toBe("REVIEW");
    expect(result.plan.focusSkillName).toBe("Double Leg");
    expect(result.plan.evidence.length).toBeGreaterThan(0);
  });

  it("classifies heavy drilling with no live application as LIVE_APPLICATION", () => {
    const result = buildTrainingPlanSuggestion(
      [skillInput({ progress: { ...baseProgress, drilling_reps: 10, live_application_count: 0 } })],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.plan.actionType).toBe("LIVE_APPLICATION");
  });

  it("classifies low sparring success as SPARRING_FOCUS", () => {
    const result = buildTrainingPlanSuggestion(
      [skillInput({ progress: { ...baseProgress, sparring_attempt_count: 5, sparring_success_count: 1 } })],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.plan.actionType).toBe("SPARRING_FOCUS");
  });

  it("picks the single highest-scoring skill as the focus, not every candidate", () => {
    const weak = skillInput({
      skillId: "skill-weak",
      skillName: "Jab",
      observations: [{ type: "question", content: "Distance?", occurredAt: daysAgo(1) }],
    });
    const strong = skillInput({
      skillId: "skill-strong",
      skillName: "Double Leg",
      observations: [{ type: "difficulty", content: "Genou qui lâche", occurredAt: daysAgo(1) }],
      progress: { ...baseProgress, drilling_reps: 10, live_application_count: 0 },
    });
    const result = buildTrainingPlanSuggestion([weak, strong], NOW);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.plan.focusSkillId).toBe("skill-strong");
  });

  it("carries prerequisite names as relatedSkills without inventing new ones", () => {
    const result = buildTrainingPlanSuggestion(
      [
        skillInput({
          observations: [{ type: "difficulty", content: "x", occurredAt: daysAgo(1) }],
          prerequisiteNames: ["Level Change"],
        }),
      ],
      NOW,
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.plan.relatedSkills).toEqual(["Level Change"]);
  });

  it("is deterministic for the same input", () => {
    const inputs = [
      skillInput({ observations: [{ type: "difficulty", content: "x", occurredAt: daysAgo(1) }] }),
    ];
    const a = buildTrainingPlanSuggestion(inputs, NOW);
    const b = buildTrainingPlanSuggestion(inputs, NOW);
    expect(a).toEqual(b);
  });
});
