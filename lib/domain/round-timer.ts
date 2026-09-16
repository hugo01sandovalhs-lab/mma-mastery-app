export type RoundTimerConfig = { rounds: number; workSeconds: number; restSeconds: number };
export type RoundTimerState = { phase: "work" | "rest" | "done"; round: number; secondsLeft: number };

export function createRoundTimer(config: RoundTimerConfig): RoundTimerState {
  return { phase: "work", round: 1, secondsLeft: config.workSeconds };
}

export function advanceRoundTimer(
  state: RoundTimerState,
  config: RoundTimerConfig,
  elapsedSeconds = 1,
): RoundTimerState {
  let next = { ...state, secondsLeft: state.secondsLeft - elapsedSeconds };
  while (next.secondsLeft <= 0 && next.phase !== "done") {
    const overflow = -next.secondsLeft;
    if (next.phase === "work" && next.round >= config.rounds) return { ...next, phase: "done", secondsLeft: 0 };
    next = next.phase === "work"
      ? { phase: "rest", round: next.round, secondsLeft: config.restSeconds - overflow }
      : { phase: "work", round: next.round + 1, secondsLeft: config.workSeconds - overflow };
  }
  return next;
}
