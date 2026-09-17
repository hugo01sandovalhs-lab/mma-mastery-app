export type VideoSearchQuery = {
  technique: string;
  difficulty: string;
  discipline: string;
};

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
