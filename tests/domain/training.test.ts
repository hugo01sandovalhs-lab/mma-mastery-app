import { describe, expect, it } from "vitest";
import {
  hasRequiredObservation,
  trainingSessionInputSchema,
} from "@/lib/domain/training";

const baseInput = {
  date: "2026-09-13",
  discipline_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  session_type: "sparring" as const,
  title: "Sparring léger",
  duration_minutes: 60,
  rpe: 6,
  notes: "RAS",
  techniques: [
    { technique_name: "Armbar depuis closed guard", category: "Soumission" },
    { technique_name: "Double leg" },
  ],
};

describe("hasRequiredObservation", () => {
  it("returns true when a difficulty observation is present", () => {
    expect(hasRequiredObservation([{ type: "difficulty" }, { type: "insight" }])).toBe(true);
  });

  it("returns true when a question observation is present", () => {
    expect(hasRequiredObservation([{ type: "question" }])).toBe(true);
  });

  it("returns false when only insight/success observations are present", () => {
    expect(hasRequiredObservation([{ type: "insight" }, { type: "success" }])).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(hasRequiredObservation([])).toBe(false);
  });
});

describe("trainingSessionInputSchema", () => {
  it("accepts a valid session with a difficulty observation", () => {
    const result = trainingSessionInputSchema.safeParse({
      ...baseInput,
      observations: [{ type: "difficulty", content: "Je perds ma garde" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid session with multiple observations of mixed types", () => {
    const result = trainingSessionInputSchema.safeParse({
      ...baseInput,
      observations: [
        { type: "question", content: "Comment mieux gérer la pression ?" },
        { type: "insight", content: "La distance change tout" },
        { type: "success", content: "Réussi un armbar en sparring" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a session with only insight/success observations", () => {
    const result = trainingSessionInputSchema.safeParse({
      ...baseInput,
      observations: [{ type: "insight", content: "Insight sans difficulté ni question" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a session with no observations", () => {
    const result = trainingSessionInputSchema.safeParse({
      ...baseInput,
      observations: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a session with multiple techniques", () => {
    const result = trainingSessionInputSchema.safeParse({
      ...baseInput,
      observations: [{ type: "difficulty", content: "Difficulté X" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.techniques).toHaveLength(2);
    }
  });

  it("accepts a session with zero techniques", () => {
    const result = trainingSessionInputSchema.safeParse({
      ...baseInput,
      techniques: [],
      observations: [{ type: "question", content: "Une question" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a technique linked to a skill and an observation linked to a skill", () => {
    const skillId = "5fa85f64-5717-4562-b3fc-2c963f66afa6";
    const result = trainingSessionInputSchema.safeParse({
      ...baseInput,
      techniques: [{ technique_name: "Double leg", skill_id: skillId }],
      observations: [{ type: "difficulty", content: "x", related_skill_id: skillId }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.techniques[0].skill_id).toBe(skillId);
      expect(result.data.observations[0].related_skill_id).toBe(skillId);
    }
  });

  it("rejects an invalid discipline_id", () => {
    const result = trainingSessionInputSchema.safeParse({
      ...baseInput,
      discipline_id: "not-a-uuid",
      observations: [{ type: "difficulty", content: "x" }],
    });
    expect(result.success).toBe(false);
  });
});
