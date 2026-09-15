import { describe, expect, it } from "vitest";
import { clubInputSchema, groupInputSchema, hasClubRoleAtLeast, inviteMemberInputSchema } from "@/lib/domain/club";

describe("clubInputSchema", () => {
  it("accepts a minimal valid club", () => {
    const result = clubInputSchema.safeParse({ name: "Team Alpha" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = clubInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("inviteMemberInputSchema", () => {
  it("accepts a minimal valid invite", () => {
    const result = inviteMemberInputSchema.safeParse({ email: "a@b.com" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = inviteMemberInputSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects inviting as OWNER", () => {
    const result = inviteMemberInputSchema.safeParse({ email: "a@b.com", role: "OWNER" });
    expect(result.success).toBe(false);
  });
});

describe("groupInputSchema", () => {
  it("accepts a minimal valid group", () => {
    const result = groupInputSchema.safeParse({ name: "Compétiteurs" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = groupInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("hasClubRoleAtLeast", () => {
  it("ranks OWNER above ADMIN", () => {
    expect(hasClubRoleAtLeast("OWNER", "ADMIN")).toBe(true);
  });

  it("ranks MEMBER below COACH", () => {
    expect(hasClubRoleAtLeast("MEMBER", "COACH")).toBe(false);
  });

  it("treats equal roles as satisfying the minimum", () => {
    expect(hasClubRoleAtLeast("COACH", "COACH")).toBe(true);
  });
});
