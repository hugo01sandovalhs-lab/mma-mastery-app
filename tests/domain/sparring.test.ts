import { describe, expect, it } from "vitest";
import { summarizeSparringRounds } from "@/lib/domain/sparring";

describe("summarizeSparringRounds", () => {
  it("counts attempts/successes only from rounds with a recorded outcome", () => {
    const summary = summarizeSparringRounds([
      { technique_name: "Armbar", outcome: "success", problem: null },
      { technique_name: "Triangle", outcome: "failure", problem: null },
      { technique_name: "Double leg", outcome: null, problem: null },
    ]);
    expect(summary.attempts).toBe(2);
    expect(summary.successes).toBe(1);
    expect(summary.successRate).toBeCloseTo(0.5);
  });

  it("returns a null success rate when no round has a recorded outcome (never fabricates a ratio)", () => {
    const summary = summarizeSparringRounds([
      { technique_name: "Armbar", outcome: null, problem: null },
    ]);
    expect(summary.attempts).toBe(0);
    expect(summary.successes).toBe(0);
    expect(summary.successRate).toBeNull();
  });

  it("surfaces a recurring difficulty once it crosses the minimum recurrence", () => {
    const summary = summarizeSparringRounds([
      { technique_name: "Armbar", outcome: "failure", problem: "Perd la garde sous pression" },
      { technique_name: "Triangle", outcome: "failure", problem: "Perd la garde sous pression" },
      { technique_name: "Kimura", outcome: "failure", problem: "Angle de bras" },
    ]);
    expect(summary.recurringDifficulties).toEqual([{ problem: "Perd la garde sous pression", count: 2 }]);
  });

  it("is case-insensitive when grouping recurring difficulties, keeping the first-seen casing", () => {
    const summary = summarizeSparringRounds([
      { technique_name: "Armbar", outcome: "failure", problem: "Distance mal gérée" },
      { technique_name: "Jab", outcome: "failure", problem: "distance mal gérée" },
    ]);
    expect(summary.recurringDifficulties).toEqual([{ problem: "Distance mal gérée", count: 2 }]);
  });

  it("ignores blank/whitespace-only problem text", () => {
    const summary = summarizeSparringRounds([
      { technique_name: "Armbar", outcome: "failure", problem: "  " },
      { technique_name: "Triangle", outcome: "failure", problem: null },
    ]);
    expect(summary.recurringDifficulties).toEqual([]);
  });

  it("caps recurring difficulties at the requested limit, most frequent first", () => {
    const rounds = [
      ...Array(3).fill({ technique_name: "a", outcome: "failure" as const, problem: "A" }),
      ...Array(2).fill({ technique_name: "b", outcome: "failure" as const, problem: "B" }),
      ...Array(2).fill({ technique_name: "c", outcome: "failure" as const, problem: "C" }),
    ];
    const summary = summarizeSparringRounds(rounds, 2, 2);
    expect(summary.recurringDifficulties).toEqual([
      { problem: "A", count: 3 },
      { problem: "B", count: 2 },
    ]);
  });
});
