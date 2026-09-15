import { describe, expect, it } from "vitest";
import { computeRate, isLowAttendanceSession } from "@/lib/domain/club-admin";

describe("computeRate", () => {
  it("returns 0 for an empty total", () => {
    expect(computeRate(0, 0)).toBe(0);
  });

  it("rounds to the nearest percent", () => {
    expect(computeRate(1, 3)).toBe(33);
  });

  it("handles a full rate", () => {
    expect(computeRate(4, 4)).toBe(100);
  });
});

describe("isLowAttendanceSession", () => {
  it("ignores sessions with too few marks to be meaningful", () => {
    expect(isLowAttendanceSession(0, 1)).toBe(false);
    expect(isLowAttendanceSession(0, 2)).toBe(false);
  });

  it("flags a session under the threshold once enough people were marked", () => {
    expect(isLowAttendanceSession(1, 3)).toBe(true);
  });

  it("does not flag a session at or above the threshold", () => {
    expect(isLowAttendanceSession(2, 4)).toBe(false);
  });
});
