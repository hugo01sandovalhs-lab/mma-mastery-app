export type ClubSharedActivity = { userId: string; date: string };

function topCounts(values: readonly string[], limit = 5) {
  const counts = new Map<string, { label: string; count: number }>();
  for (const raw of values) {
    const label = raw.trim();
    if (!label) continue;
    const key = label.toLocaleLowerCase();
    const current = counts.get(key);
    counts.set(key, { label: current?.label ?? label, count: (current?.count ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, limit);
}

export function buildClubSharedInsights(input: {
  sharingUserIds: readonly string[];
  sessions: readonly ClubSharedActivity[];
  difficulties: readonly string[];
  youtubeTopics: readonly string[];
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const cutoff = new Date(now.getTime() - 14 * 86_400_000);
  const recent = input.sessions.filter((session) => new Date(session.date) >= cutoff);
  const activeIds = new Set(recent.map((session) => session.userId));
  return {
    recentSessionCount: recent.length,
    inactiveUserIds: input.sharingUserIds.filter((id) => !activeIds.has(id)),
    recurringDifficulties: topCounts(input.difficulties),
    searchedTopics: topCounts(input.youtubeTopics),
  };
}
