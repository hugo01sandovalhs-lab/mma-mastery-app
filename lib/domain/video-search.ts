export type VideoSearchQuery = {
  technique: string;
  difficulty: string;
  discipline: string;
};

export function buildYouTubeSearchSuggestions(query: VideoSearchQuery): string[] {
  const discipline = query.discipline.trim().toLocaleLowerCase() || "mma";
  const technique = query.technique.trim().toLocaleLowerCase();
  if (!technique) return [];

  const needsVerb = !/^(throw|land|perform|escape|pass|defend|finish|set up|use|wrestle)\b/.test(technique);
  const howTo = `how to ${needsVerb ? "do a " : ""}${technique} in ${discipline}`;
  const primary = ["muay thai", "karate", "grappling"].includes(discipline)
    ? howTo
    : `${technique} technique ${discipline}`;
  const candidates = [
    primary,
    `${technique} common mistakes ${discipline}`,
    `options from ${technique} in ${discipline}`,
    howTo,
    query.difficulty.trim() && `${technique} ${query.difficulty.trim().toLocaleLowerCase()} ${discipline}`,
    `${technique} drills ${discipline}`,
  ].filter(Boolean) as string[];

  return [...new Set(candidates)].slice(0, 4);
}

export function inferVideoSearchQuery(question: string | undefined, fallbackTechnique: string): VideoSearchQuery {
  if (!question?.trim()) return { discipline: "MMA", technique: fallbackTechnique, difficulty: "" };

  const parts = question.split("/").map((part) => part.trim()).filter(Boolean);
  const lower = question.toLocaleLowerCase();
  const discipline = ["Muay Thai", "BJJ", "Grappling", "Karate", "MMA"].find((name) =>
    lower.includes(name.toLocaleLowerCase()),
  ) ?? "MMA";

  if (parts.length >= 2) {
    return {
      discipline,
      technique: parts[1],
      difficulty: (parts[2] ?? "").replace(/^(difficulté|difficulty)\s*(à|to)?\s*/i, ""),
    };
  }

  const technique = question
    .replace(/\b(muay thai|grappling|karate|mma|bjj|jiu[- ]jitsu)\b/gi, "")
    .replace(/^(comment\s+(améliorer|faire)|how\s+to(\s+do)?|je\s+n'arrive\s+pas\s+à)\s*/i, "")
    .replace(/\b(en|in)\s*[?.!]*$/i, "")
    .replace(/[?.!]+$/g, "")
    .replace(/^(mon|ma|mes|un|une|a|an)\s+/i, "")
    .trim();

  return { discipline, technique: technique || fallbackTechnique, difficulty: "" };
}

export type VideoSearchResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
};

export interface VideoSearchProvider {
  readonly name: string;
  search(query: VideoSearchQuery): Promise<VideoSearchResult[]>;
}
