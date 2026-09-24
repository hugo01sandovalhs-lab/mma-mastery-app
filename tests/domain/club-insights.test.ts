import { describe, expect, it } from "vitest";
import { buildClubSharedInsights } from "@/lib/domain/club-insights";

describe("buildClubSharedInsights", () => {
  it("reports facts from shared data without judging members", () => {
    const result = buildClubSharedInsights({
      sharingUserIds: ["active", "quiet"],
      sessions: [{ userId: "active", date: "2026-09-20" }, { userId: "active", date: "2026-08-01" }],
      difficulties: ["Turtle defense", "turtle defense", "Distance"],
      youtubeTopics: ["Jab", "Jab", "Sprawl"],
      now: new Date("2026-09-24T12:00:00Z"),
    });
    expect(result.recentSessionCount).toBe(1);
    expect(result.inactiveUserIds).toEqual(["quiet"]);
    expect(result.recurringDifficulties[0]).toEqual({ label: "Turtle defense", count: 2 });
    expect(result.searchedTopics[0]).toEqual({ label: "Jab", count: 2 });
  });
});
