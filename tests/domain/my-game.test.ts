import { describe, expect, it } from "vitest";
import { buildMyGame } from "@/lib/domain/my-game";
import type { SkillIntelligenceInput } from "@/lib/domain/training-intelligence";

const base: SkillIntelligenceInput = {
  skillId: "skill-1", skillName: "Jab", disciplineName: "Boxing", category: "punch",
  progress: { knowledge_level: 0, drilling_reps: 0, live_application_count: 0, sparring_attempt_count: 0, sparring_success_count: 0, consistency_score: null, pressure_performance_level: null, confidence_level: null, evidence_count: 0, last_practiced_at: null },
  observations: [], lastPracticedAt: null, prerequisiteNames: [],
};

describe("buildMyGame", () => {
  it("classifies only evidence-backed skills", () => {
    expect(buildMyGame([base])).toEqual([]);
    expect(buildMyGame([{ ...base, progress: { ...base.progress, live_application_count: 3 } }])[0]?.section).toBe("in_game");
    expect(buildMyGame([{ ...base, progress: { ...base.progress, drilling_reps: 10 } }])[0]?.section).toBe("to_work");
    expect(buildMyGame([{ ...base, progress: { ...base.progress, evidence_count: 1 } }])[0]?.section).toBe("developing");
  });
});
