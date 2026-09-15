import { describe, expect, it } from "vitest";
import { goalInputSchema, resourceInputSchema, skillNoteInputSchema } from "@/lib/domain/knowledge";

describe("resourceInputSchema", () => {
  it("accepts a minimal valid video resource", () => {
    const result = resourceInputSchema.safeParse({
      type: "video",
      title: "Double leg finishing details",
      url: "https://youtube.com/watch?v=abc",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid url", () => {
    const result = resourceInputSchema.safeParse({
      type: "video",
      title: "Bad link",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative timestamp", () => {
    const result = resourceInputSchema.safeParse({
      type: "video",
      title: "Timed video",
      url: "https://example.com/video",
      timestamp_seconds: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = resourceInputSchema.safeParse({
      type: "article",
      title: "",
      url: "https://example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("skillNoteInputSchema", () => {
  it("accepts a valid note", () => {
    const result = skillNoteInputSchema.safeParse({
      skill_id: "5fa85f64-5717-4562-b3fc-2c963f66afa6",
      content: "Garder les hanches proches",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty note", () => {
    const result = skillNoteInputSchema.safeParse({
      skill_id: "5fa85f64-5717-4562-b3fc-2c963f66afa6",
      content: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("goalInputSchema", () => {
  it("accepts a minimal valid goal", () => {
    const result = goalInputSchema.safeParse({ horizon: "short", title: "Passer ceinture bleue" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid horizon", () => {
    const result = goalInputSchema.safeParse({ horizon: "yearly", title: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid due_date", () => {
    const result = goalInputSchema.safeParse({ horizon: "short", title: "x", due_date: "not-a-date" });
    expect(result.success).toBe(false);
  });
});
