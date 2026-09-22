import { describe, expect, it } from "vitest";
import {
  computeRecentTrend,
  summarizePositionBreakdown,
  summarizeSparringRounds,
  summarizeTechniqueBreakdown,
} from "@/lib/domain/sparring";

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

describe("summarizePositionBreakdown", () => {
  it("splits positions into weak/strong once they cross the minimum sample size", () => {
    const rounds = [
      { technique_name: "a", outcome: "failure" as const, problem: null, position: "Bottom mount" },
      { technique_name: "b", outcome: "failure" as const, problem: null, position: "Bottom mount" },
      { technique_name: "c", outcome: "success" as const, problem: null, position: "Bottom mount" },
      { technique_name: "d", outcome: "success" as const, problem: null, position: "Top side control" },
      { technique_name: "e", outcome: "success" as const, problem: null, position: "Top side control" },
    ];
    const { weakPositions, strongPositions } = summarizePositionBreakdown(rounds);
    expect(weakPositions[0]).toEqual({ position: "Bottom mount", attempts: 3, successRate: expect.closeTo(1 / 3) });
    expect(strongPositions[0]).toEqual({ position: "Top side control", attempts: 2, successRate: 1 });
  });

  it("excludes positions below the minimum attempt threshold", () => {
    const rounds = [{ technique_name: "a", outcome: "success" as const, problem: null, position: "Back control" }];
    const { weakPositions, strongPositions } = summarizePositionBreakdown(rounds);
    expect(weakPositions).toEqual([]);
    expect(strongPositions).toEqual([]);
  });

  it("ignores rounds with no position or no recorded outcome", () => {
    const rounds = [
      { technique_name: "a", outcome: "success" as const, problem: null, position: null },
      { technique_name: "b", outcome: null, problem: null, position: "Guard" },
    ];
    const { weakPositions, strongPositions } = summarizePositionBreakdown(rounds);
    expect(weakPositions).toEqual([]);
    expect(strongPositions).toEqual([]);
  });
});

describe("summarizeTechniqueBreakdown", () => {
  it("ranks most-attempted techniques by total logged count regardless of outcome", () => {
    const rounds = [
      { technique_name: "Jab", outcome: null, problem: null },
      { technique_name: "Jab", outcome: "success" as const, problem: null },
      { technique_name: "Cross", outcome: "success" as const, problem: null },
    ];
    const { mostAttempted } = summarizeTechniqueBreakdown(rounds);
    expect(mostAttempted[0]).toEqual({ technique: "Jab", attempts: 2, successRate: 1 });
  });

  it("ranks least-successful techniques only once they have enough scored rounds", () => {
    const rounds = [
      { technique_name: "Armbar", outcome: "failure" as const, problem: null },
      { technique_name: "Armbar", outcome: "failure" as const, problem: null },
      { technique_name: "Kimura", outcome: "failure" as const, problem: null },
    ];
    const { leastSuccessful } = summarizeTechniqueBreakdown(rounds);
    expect(leastSuccessful).toEqual([{ technique: "Armbar", attempts: 2, successRate: 0 }]);
  });
});

describe("computeRecentTrend", () => {
  it("returns null when there isn't scored data on both sides", () => {
    const sessions = [{ date: "2024-01-01", rounds: [{ technique_name: "a", outcome: "success" as const, problem: null }] }];
    expect(computeRecentTrend(sessions)).toBeNull();
  });

  it("detects an upward trend when recent sessions score better than prior ones", () => {
    const win = { technique_name: "a", outcome: "success" as const, problem: null };
    const loss = { technique_name: "a", outcome: "failure" as const, problem: null };
    const sessions = [
      { date: "2024-03-01", rounds: [win, win] },
      { date: "2024-02-01", rounds: [win, win] },
      { date: "2024-01-01", rounds: [win, win] },
      { date: "2023-12-01", rounds: [loss, loss] },
    ];
    const trend = computeRecentTrend(sessions);
    expect(trend?.direction).toBe("up");
    expect(trend?.recentRate).toBe(1);
    expect(trend?.priorRate).toBe(0);
  });
});
