import { describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/domain/profile";

describe("profileSchema", () => {
  it("accepts a valid profile", () => {
    const result = profileSchema.safeParse({
      user_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      display_name: "Hugo",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid user_id", () => {
    const result = profileSchema.safeParse({
      user_id: "not-a-uuid",
      display_name: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(result.success).toBe(false);
  });
});
