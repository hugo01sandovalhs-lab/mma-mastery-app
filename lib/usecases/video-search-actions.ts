import "server-only";

import type { VideoSearchQuery, VideoSearchResult } from "@/lib/domain/video-search";
import { YouTubeVideoSearchProvider } from "@/lib/infra/video/youtube-video-search-provider";

const provider = new YouTubeVideoSearchProvider(process.env.YOUTUBE_API_KEY);

export async function searchTechniqueVideos(query: VideoSearchQuery): Promise<VideoSearchResult[]> {
  return provider.search(query);
}
