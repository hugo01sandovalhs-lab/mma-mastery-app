import { describe, expect, it } from "vitest";
import { friendCodeSchema } from "@/lib/domain/training-partner";

describe("friendCodeSchema", () => {
  it("normalizes a shared code before lookup", () => {
    expect(friendCodeSchema.parse(" ab12-cd34 ")).toBe("AB12CD34");
  });

  it("rejects malformed codes instead of querying arbitrary profile data", () => {
    expect(friendCodeSchema.safeParse("abc").success).toBe(false);
    expect(friendCodeSchema.safeParse("AB12_CD34").success).toBe(false);
  });
});
