import { describe, expect, it } from "vitest";
import { athleteInputSchema, matchInputSchema, sequenceInputSchema } from "@/lib/domain/competition";

describe("athleteInputSchema", () => {
  it("accepts a minimal valid athlete", () => {
    const result = athleteInputSchema.safeParse({ name: "Jean Dupont" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = athleteInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("matchInputSchema", () => {
  const disciplineId = "5fa85f64-5717-4562-b3fc-2c963f66afa6";

  it("accepts a minimal valid match", () => {
    const result = matchInputSchema.safeParse({ discipline_id: disciplineId, date: "2026-01-01" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing discipline", () => {
    const result = matchInputSchema.safeParse({ discipline_id: "not-a-uuid", date: "2026-01-01" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid date", () => {
    const result = matchInputSchema.safeParse({ discipline_id: disciplineId, date: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid result", () => {
    const result = matchInputSchema.safeParse({
      discipline_id: disciplineId,
      date: "2026-01-01",
      result: "submission",
    });
    expect(result.success).toBe(false);
  });
});

describe("sequenceInputSchema", () => {
  it("accepts a minimal valid sequence", () => {
    const result = sequenceInputSchema.safeParse({ title: "Passage de garde" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = sequenceInputSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a timestamp end before start", () => {
    const result = sequenceInputSchema.safeParse({
      title: "Sweep",
      timestamp_start: 30,
      timestamp_end: 10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts an equal start and end timestamp", () => {
    const result = sequenceInputSchema.safeParse({
      title: "Sweep",
      timestamp_start: 10,
      timestamp_end: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid source url", () => {
    const result = sequenceInputSchema.safeParse({ title: "Sweep", source_url: "not-a-url" });
    expect(result.success).toBe(false);
  });
});
