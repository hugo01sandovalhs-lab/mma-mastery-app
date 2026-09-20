import "server-only";

import type {
  VideoSearchProvider,
  VideoSearchQuery,
  VideoSearchResult,
} from "@/lib/domain/video-search";

const ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const MAX_RESULTS = 3;

/**
 * Light, deterministic channel preference by discipline family — matched
 * against the already-returned `channelTitle` (no extra API call, no
 * fabricated quality score). Query relevance from the YouTube API's own
 * `order: relevance` stays the primary signal: this only ever *reorders*
 * results the API already judged relevant, never injects or drops one.
 */
const PREFERRED_CHANNELS: { disciplines: RegExp; channels: RegExp } = {
  disciplines: /\b(bjj|grappling|jiu[- ]?jitsu|wrestling)\b/i,
  channels: /jordan teaches jiu-jitsu|bernardo faria|bjj fanatics|john danaher|gordon ryan/i,
};
const PREFERRED_STRIKING_CHANNELS: { disciplines: RegExp; channels: RegExp } = {
  disciplines: /\b(mma|muay thai|boxing|karate)\b/i,
  channels: /mma shredded/i,
};

/**
 * Moves at most one preferred-channel result up into the #2 slot when the
 * discipline matches, so it has a chance to appear among the first 1-2
 * recommendations callers show — without ever displacing the #1 (most
 * relevant) result or dropping anything.
 */
function boostPreferredChannel(results: VideoSearchResult[], discipline: string): VideoSearchResult[] {
  const group = PREFERRED_CHANNELS.disciplines.test(discipline)
    ? PREFERRED_CHANNELS
    : PREFERRED_STRIKING_CHANNELS.disciplines.test(discipline)
      ? PREFERRED_STRIKING_CHANNELS
      : null;
  if (!group || results.length < 2) return results;

  const preferredIndex = results.findIndex((r) => group.channels.test(r.channelTitle));
  if (preferredIndex <= 1) return results; // already in the #1 or #2 slot, or none found

  const reordered = [...results];
  const [preferred] = reordered.splice(preferredIndex, 1);
  reordered.splice(1, 0, preferred);
  return reordered;
}

type CacheEntry = {
  expiresAt: number;
  results: Promise<VideoSearchResult[]>;
};

type YouTubeItem = {
  id?: { videoId?: unknown };
  snippet?: {
    title?: unknown;
    channelTitle?: unknown;
    thumbnails?: Record<string, { url?: unknown }>;
  };
};

export class YouTubeVideoSearchProvider implements VideoSearchProvider {
  readonly name = "youtube";
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly apiKey?: string) {}

  async search(query: VideoSearchQuery): Promise<VideoSearchResult[]> {
    if (!this.apiKey || !query.technique.trim()) return [];

    const cacheKey = [query.technique, query.difficulty, query.discipline]
      .map((value) => value.trim().toLocaleLowerCase())
      .join("|");
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) return cached.results;
    if (cached) this.cache.delete(cacheKey);

    const results = this.fetchVideos(query);
    this.cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, results });
    if (this.cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    return results;
  }

  private async fetchVideos(query: VideoSearchQuery): Promise<VideoSearchResult[]> {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      order: "relevance",
      maxResults: String(MAX_RESULTS),
      fields: "items(id/videoId,snippet(title,channelTitle,thumbnails))",
      q: [query.technique, query.difficulty, query.discipline, "tutorial", "drill", "breakdown"]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" "),
      key: this.apiKey!,
    });

    try {
      const response = await fetch(`${ENDPOINT}?${params}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return [];
      const body = (await response.json()) as { items?: YouTubeItem[] };
      if (!Array.isArray(body.items)) return [];

      const results = body.items.flatMap((item) => {
        const videoId = item.id?.videoId;
        const title = item.snippet?.title;
        const channelTitle = item.snippet?.channelTitle;
        const thumbnails = item.snippet?.thumbnails;
        const thumbnail = thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url;
        if (
          typeof videoId !== "string" ||
          typeof title !== "string" ||
          typeof channelTitle !== "string" ||
          typeof thumbnail !== "string"
        ) return [];

        return [{
          videoId,
          title,
          channelTitle,
          thumbnail,
          url: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        }];
      });

      return boostPreferredChannel(results, query.discipline);
    } catch {
      return [];
    }
  }
}
