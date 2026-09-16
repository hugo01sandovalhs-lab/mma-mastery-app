import { describe, expect, it } from "vitest";
import { advanceRoundTimer, createRoundTimer } from "@/lib/domain/round-timer";

describe("round timer", () => {
  it("moves from work to rest, then starts the next round", () => {
    const config = { rounds: 3, workSeconds: 180, restSeconds: 60 };
    const workEnd = advanceRoundTimer(createRoundTimer(config), config, 180);
    expect(workEnd).toMatchObject({ phase: "rest", round: 1, secondsLeft: 60 });

    const nextRound = advanceRoundTimer(workEnd, config, 60);
    expect(nextRound).toMatchObject({ phase: "work", round: 2, secondsLeft: 180 });
  });

  it("finishes after the last work period", () => {
    const config = { rounds: 1, workSeconds: 5, restSeconds: 2 };
    expect(advanceRoundTimer(createRoundTimer(config), config, 5)).toMatchObject({
      phase: "done",
      round: 1,
      secondsLeft: 0,
    });
  });
});
