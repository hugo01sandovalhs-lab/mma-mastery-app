import { describe, expect, it } from "vitest";
import { DeterministicCoachProvider } from "@/lib/infra/ai/deterministic-provider";
import type { CoachContext } from "@/lib/domain/ai-coach";

describe("DeterministicCoachProvider", () => {
  const provider = new DeterministicCoachProvider();

  it("returns insufficient_data when there are no facts", async () => {
    const context: CoachContext = { generatedAt: new Date().toISOString(), facts: [] };
    const result = await provider.generateCoachResponse(context);
    expect(result.status).toBe("insufficient_data");
  });

  it("never invents a recommendation not grounded in a context fact", async () => {
    const context: CoachContext = {
      generatedAt: new Date().toISOString(),
      facts: [
        { kind: "OBSERVED", statement: "10 reps drilling" },
        { kind: "INFERRED", statement: "Passer à l'application live" },
      ],
    };
    const result = await provider.generateCoachResponse(context);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].statement).toBe("Passer à l'application live");
    expect(result.recommendations[0].basedOnFactIndexes).toEqual([1]);
  });

  it("is deterministic for the same context", async () => {
    const context: CoachContext = {
      generatedAt: new Date().toISOString(),
      facts: [{ kind: "OBSERVED", statement: "x" }],
    };
    const a = await provider.generateCoachResponse(context);
    const b = await provider.generateCoachResponse(context);
    expect(a).toEqual(b);
  });
});
