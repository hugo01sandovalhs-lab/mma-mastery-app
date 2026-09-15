import { describe, expect, it } from "vitest";
import { clubEventInputSchema, isUpcoming } from "@/lib/domain/club-event";

describe("clubEventInputSchema", () => {
  it("accepts a minimal valid event and defaults the type", () => {
    const result = clubEventInputSchema.safeParse({ name: "Interclub Lyon", starts_at: "2026-10-01T18:00" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.event_type).toBe("event");
  });

  it("rejects an empty name", () => {
    const result = clubEventInputSchema.safeParse({ name: "", starts_at: "2026-10-01T18:00" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing date", () => {
    const result = clubEventInputSchema.safeParse({ name: "Stage", starts_at: "" });
    expect(result.success).toBe(false);
  });
});

describe("isUpcoming", () => {
  it("treats a future date as upcoming", () => {
    expect(isUpcoming(new Date(Date.now() + 86_400_000).toISOString())).toBe(true);
  });

  it("treats a past date as not upcoming", () => {
    expect(isUpcoming(new Date(Date.now() - 86_400_000).toISOString())).toBe(false);
  });
});
