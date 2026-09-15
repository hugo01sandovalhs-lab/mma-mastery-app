import { describe, expect, it } from "vitest";
import { checkinCodeIsValid, classInputSchema, classSessionInputSchema } from "@/lib/domain/class";

describe("classInputSchema", () => {
  it("accepts a minimal valid class", () => {
    const result = classInputSchema.safeParse({ name: "Muay Thai débutant" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = classInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("coerces optional numeric fields from form strings", () => {
    const result = classInputSchema.safeParse({
      name: "Grappling",
      day_of_week: "3",
      duration_minutes: "60",
      capacity: "20",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.day_of_week).toBe(3);
      expect(result.data.duration_minutes).toBe(60);
      expect(result.data.capacity).toBe(20);
    }
  });

  it("rejects an out-of-range day_of_week", () => {
    const result = classInputSchema.safeParse({ name: "Boxe", day_of_week: "7" });
    expect(result.success).toBe(false);
  });
});

describe("classSessionInputSchema", () => {
  it("accepts a minimal valid session", () => {
    const result = classSessionInputSchema.safeParse({ starts_at: "2026-01-01T18:00" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty starts_at", () => {
    const result = classSessionInputSchema.safeParse({ starts_at: "" });
    expect(result.success).toBe(false);
  });
});

describe("checkinCodeIsValid", () => {
  it("returns false for a null expiry", () => {
    expect(checkinCodeIsValid(null)).toBe(false);
  });

  it("returns false for a past expiry", () => {
    expect(checkinCodeIsValid(new Date(Date.now() - 1000).toISOString())).toBe(false);
  });

  it("returns true for a future expiry", () => {
    expect(checkinCodeIsValid(new Date(Date.now() + 60_000).toISOString())).toBe(true);
  });
});
