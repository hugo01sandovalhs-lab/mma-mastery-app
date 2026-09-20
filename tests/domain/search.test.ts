import { describe, expect, it } from "vitest";
import {
  expandQueryKeywords,
  extractVideoIntent,
  levenshtein,
  matchNavigationIntents,
  scoreSkillMatch,
} from "@/lib/domain/search";

describe("matchNavigationIntents", () => {
  it("surfaces the training destination for 'mes séances' (fr)", () => {
    const matches = matchNavigationIntents("mes séances", "fr");
    expect(matches.map((m) => m.destination)).toEqual(["training"]);
  });

  it("surfaces the goals destination for 'my goals' (en)", () => {
    const matches = matchNavigationIntents("my goals", "en");
    expect(matches.map((m) => m.destination)).toEqual(["goals"]);
  });

  it("surfaces the coach destination for 'quoi travailler aujourd'hui' (fr)", () => {
    const matches = matchNavigationIntents("quoi travailler aujourd'hui", "fr");
    expect(matches.map((m) => m.destination)).toEqual(["coach"]);
  });

  it("returns nothing for a plain technique query", () => {
    expect(matchNavigationIntents("arm drag", "en")).toEqual([]);
  });
});

describe("extractVideoIntent", () => {
  it("strips the video keyword and reports intent (fr)", () => {
    expect(extractVideoIntent("sprawl vidéo", "fr")).toEqual({ remainder: "sprawl", hasVideoIntent: true });
  });

  it("leaves the query untouched when there is no video keyword", () => {
    expect(extractVideoIntent("arm drag", "en")).toEqual({ remainder: "arm drag", hasVideoIntent: false });
  });
});

describe("expandQueryKeywords", () => {
  it("maps a French category alias to its English catalog keyword", () => {
    expect(expandQueryKeywords("garde", "fr")).toContain("guard");
  });

  it("returns nothing for a query with no known alias", () => {
    expect(expandQueryKeywords("arm drag", "fr")).toEqual([]);
  });
});

describe("scoreSkillMatch", () => {
  it("ranks an exact name match highest", () => {
    const score = scoreSkillMatch({ name: "Arm Drag", category: "takedown" }, "arm drag", []);
    expect(score).toBe(100);
  });

  it("matches via alias-expanded keywords when the name itself doesn't contain the query", () => {
    const score = scoreSkillMatch({ name: "Closed Guard", category: "guard" }, "garde", ["guard"]);
    expect(score).toBeGreaterThan(0);
  });

  it("tolerates a small typo via fuzzy matching", () => {
    const score = scoreSkillMatch({ name: "Sprawl", category: "defense" }, "sprwal", []);
    expect(score).toBeGreaterThan(0);
  });

  it("returns 0 for an unrelated query", () => {
    const score = scoreSkillMatch({ name: "Armbar", category: "submission" }, "footwork drilling combo", []);
    expect(score).toBe(0);
  });
});

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("sprawl", "sprawl")).toBe(0);
  });

  it("counts the edit distance for a single transposition", () => {
    expect(levenshtein("sprawl", "sprwal")).toBe(2);
  });
});
