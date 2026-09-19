import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { normalizeSearchQuery } from "@/lib/usecases/search-actions";

describe("normalizeSearchQuery", () => {
  it.each([
    ["Comment faire un armbar ?", "armbar"],
    ["Qu'est-ce que l'open guard ?", "open guard"],
    ["Comment maîtriser le double leg", "double leg"],
    ["Quelles sont les erreurs les plus courantes en jab ?", "jab"],
  ])("turns a guided question into searchable terms (fr)", (question, expected) => {
    expect(normalizeSearchQuery(question)).toBe(expected);
  });

  it.each([
    ["How do I do an armbar?", "armbar"],
    ["What is the open guard?", "open guard"],
    ["How do I master the double leg?", "double leg"],
    ["What are the most common mistakes in the jab?", "jab"],
  ])("turns a guided question into searchable terms (en)", (question, expected) => {
    expect(normalizeSearchQuery(question, "en")).toBe(expected);
  });

  it.each([
    ["¿Cómo hacer un armbar?", "armbar"],
    ["¿Qué es la open guard?", "open guard"],
    ["¿Cómo dominar el double leg?", "double leg"],
  ])("turns a guided question into searchable terms (es)", (question, expected) => {
    expect(normalizeSearchQuery(question, "es")).toBe(expected);
  });

  it.each([
    ["Wie macht man einen Armbar?", "Armbar"],
    ["Was ist der Open Guard?", "Open Guard"],
    ["Wie meistert man den Double Leg?", "Double Leg"],
  ])("turns a guided question into searchable terms (de)", (question, expected) => {
    expect(normalizeSearchQuery(question, "de")).toBe(expected);
  });

  it.each([
    ["Как делать армбар?", "армбар"],
    ["Что такое открытая гвардия?", "открытая гвардия"],
  ])("turns a guided question into searchable terms (ru)", (question, expected) => {
    expect(normalizeSearchQuery(question, "ru")).toBe(expected);
  });

  it.each([
    ["アームバーのやり方は？", "アームバー"],
    ["オープンガードとは？", "オープンガード"],
    ["ダブルレッグを極めるには？", "ダブルレッグ"],
  ])("turns a guided question into searchable terms (ja)", (question, expected) => {
    expect(normalizeSearchQuery(question, "ja")).toBe(expected);
  });
});
