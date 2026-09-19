import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/i18n-server", () => ({
  getServerLocale: vi.fn(async () => "fr"),
}));

vi.mock("@/lib/usecases/training-intelligence-actions", () => ({
  getTrainingIntelligenceBundle: vi.fn(async () => ({
    intelligence: { status: "ok", recommendations: [] },
    plan: {
      status: "ok",
      plan: {
        focusSkillId: "skill-1",
        focusSkillName: "Garde fermée",
        actionType: "DRILL",
        objective: "Automatiser la garde",
        reasons: ["Stage actuel: Introduit"],
        evidence: ["Stage actuel: Introduit"],
        relatedSkills: [],
      },
    },
  })),
}));

vi.mock("@/lib/usecases/review-actions", () => ({
  getReviewQueue: vi.fn(async () => []),
}));

vi.mock("@/lib/usecases/goals-actions", () => ({
  getUpcomingGoals: vi.fn(async () => []),
}));

vi.mock("@/lib/usecases/knowledge-actions", () => ({
  getStudyQueue: vi.fn(async () => []),
}));

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("getCoachResponse", () => {
  it("uses the deterministic provider when Ollama is not configured", async () => {
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.OLLAMA_MODEL;
    const { getCoachResponse } = await import("@/lib/usecases/ai-coach-actions");

    const answer = await getCoachResponse();

    expect(answer.providerName).toBe("deterministic-fallback");
    expect(answer.context.facts.length).toBeGreaterThan(0);
  });

  it("falls back to deterministic when the configured Ollama call fails", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.OLLAMA_MODEL = "llama3";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")),
    );
    const { getCoachResponse } = await import("@/lib/usecases/ai-coach-actions");

    const answer = await getCoachResponse();

    expect(answer.providerName).toBe("deterministic-fallback");
    expect(answer.response.status).toBe("ok");
  });

  it("uses the Ollama provider when configured and reachable", async () => {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.OLLAMA_MODEL = "llama3";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ response: "Travaille ta garde." }) }),
    );
    const { getCoachResponse } = await import("@/lib/usecases/ai-coach-actions");

    const answer = await getCoachResponse();

    expect(answer.providerName).toBe("ollama");
    if (answer.response.status === "ok") {
      expect(answer.response.summary).toBe("Travaille ta garde.");
    }
  });
});
