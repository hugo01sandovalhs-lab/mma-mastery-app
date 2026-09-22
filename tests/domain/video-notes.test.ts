import { describe, expect, it } from "vitest";
import { decodeVideoNote, encodeVideoNote, formatTimestamp } from "@/lib/domain/video-notes";

describe("encodeVideoNote / decodeVideoNote", () => {
  it("round-trips a note's kind and text", () => {
    const encoded = encodeVideoNote("timing", "Trop lent sur la transition");
    expect(encoded).toBe("[timing] Trop lent sur la transition");
    expect(decodeVideoNote(encoded)).toEqual({ kind: "timing", text: "Trop lent sur la transition" });
  });

  it("trims the text before encoding", () => {
    expect(encodeVideoNote("detail", "  espace en trop  ")).toBe("[detail] espace en trop");
  });

  it("degrades unprefixed/legacy notes to a null kind, text unchanged", () => {
    expect(decodeVideoNote("Une note existante sans préfixe")).toEqual({
      kind: null,
      text: "Une note existante sans préfixe",
    });
  });

  it("does not mistake an unrelated bracketed string for a kind prefix", () => {
    expect(decodeVideoNote("[not-a-kind] texte")).toEqual({ kind: null, text: "[not-a-kind] texte" });
  });
});

describe("formatTimestamp", () => {
  it("formats seconds as m:ss", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(65)).toBe("1:05");
    expect(formatTimestamp(600)).toBe("10:00");
  });

  it("clamps negative input to 0", () => {
    expect(formatTimestamp(-5)).toBe("0:00");
  });
});
