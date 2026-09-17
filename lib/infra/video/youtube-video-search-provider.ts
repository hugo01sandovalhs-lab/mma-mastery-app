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

      return body.items.flatMap((item) => {
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
    } catch {
      return [];
    }
  }
}
