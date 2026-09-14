import { afterEach, describe, expect, it, vi } from "vitest";
import { OllamaCoachProvider } from "@/lib/infra/ai/ollama-provider";
import type { CoachContext } from "@/lib/domain/ai-coach";

const context: CoachContext = {
  generatedAt: new Date().toISOString(),
  facts: [{ kind: "OBSERVED", statement: "10 reps drilling" }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OllamaCoachProvider", () => {
  it("returns insufficient_data without calling the network when context is empty", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OllamaCoachProvider("http://localhost:11434", "llama3");

    const result = await provider.generateCoachResponse({ generatedAt: context.generatedAt, facts: [] });

    expect(result.status).toBe("insufficient_data");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the model's text as summary, never as a grounded recommendation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: "Travaille ton drilling de garde." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OllamaCoachProvider("http://localhost:11434", "llama3");

    const result = await provider.generateCoachResponse(context);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.summary).toBe("Travaille ton drilling de garde.");
    expect(result.recommendations).toEqual([]);
  });

  it("throws on a non-ok HTTP response so the caller can fall back", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OllamaCoachProvider("http://localhost:11434", "llama3");

    await expect(provider.generateCoachResponse(context)).rejects.toThrow();
  });

  it("returns insufficient_data when the model responds with empty text", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ response: "" }) });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OllamaCoachProvider("http://localhost:11434", "llama3");

    const result = await provider.generateCoachResponse(context);

    expect(result.status).toBe("insufficient_data");
  });
});
