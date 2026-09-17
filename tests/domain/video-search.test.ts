import { describe, expect, it } from "vitest";
import { buildYouTubeSearchSuggestions, inferVideoSearchQuery } from "@/lib/domain/video-search";

describe("buildYouTubeSearchSuggestions", () => {
  it.each([
    ["MMA", "overhook takedown", "finding opportunities", "overhook takedown technique mma"],
    ["Muay Thai", "throw a knee", "", "how to throw a knee in muay thai"],
    ["Karate", "spinning back kick", "", "how to do a spinning back kick in karate"],
    ["Grappling", "guillotine", "", "how to do a guillotine in grappling"],
    ["BJJ", "de la riva guard", "", "de la riva guard technique bjj"],
  ])("creates an actionable primary query for %s", (discipline, technique, difficulty, primary) => {
    const suggestions = buildYouTubeSearchSuggestions({ discipline, technique, difficulty });

    expect(suggestions[0]).toBe(primary);
    expect(suggestions).toHaveLength(4);
    expect(new Set(suggestions).size).toBe(4);
  });
});

describe("inferVideoSearchQuery", () => {
  it("extracts discipline, technique and difficulty from a natural coach question", () => {
    expect(inferVideoSearchQuery("MMA / overhook takedown / difficulté à trouver les opportunités", "fallback")).toEqual({
      discipline: "MMA",
      technique: "overhook takedown",
      difficulty: "trouver les opportunités",
    });
  });

  it("uses the coach recommendation when the question has no usable technique", () => {
    expect(inferVideoSearchQuery(undefined, "De la Riva guard")).toEqual({
      discipline: "MMA",
      technique: "De la Riva guard",
      difficulty: "",
    });
  });
});
