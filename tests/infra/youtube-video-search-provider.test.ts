import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { YouTubeVideoSearchProvider } from "@/lib/infra/video/youtube-video-search-provider";

const query = {
  technique: "Armbar",
  difficulty: "beginner",
  discipline: "Brazilian Jiu-Jitsu",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("YouTubeVideoSearchProvider", () => {
  it("returns only real YouTube results with the useful fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [
              {
                id: { videoId: "abc123" },
                snippet: {
                  title: "Armbar fundamentals",
                  channelTitle: "BJJ Academy",
                  thumbnails: { medium: { url: "https://img.youtube.com/abc123.jpg" } },
                },
              },
              { id: {}, snippet: { title: "Not a video", channelTitle: "Ignored" } },
            ],
          }),
        ),
      ),
    );
    const provider = new YouTubeVideoSearchProvider("secret");

    const results = await provider.search(query);

    expect(results).toEqual([
      {
        videoId: "abc123",
        title: "Armbar fundamentals",
        channelTitle: "BJJ Academy",
        thumbnail: "https://img.youtube.com/abc123.jpg",
        url: "https://www.youtube.com/watch?v=abc123",
      },
    ]);
    const requestUrl = new URL(vi.mocked(fetch).mock.calls[0][0].toString());
    expect(requestUrl.searchParams.get("q")).toBe(
      "Armbar beginner Brazilian Jiu-Jitsu tutorial drill breakdown",
    );
    expect(requestUrl.searchParams.get("type")).toBe("video");
    expect(requestUrl.searchParams.get("maxResults")).toBe("3");
  });

  it("caches repeated searches for the same technique, difficulty and discipline", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] })));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new YouTubeVideoSearchProvider("secret");

    await provider.search(query);
    await provider.search({ technique: " armbar ", difficulty: "BEGINNER", discipline: "brazilian jiu-jitsu" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an empty fallback without making a request when the key is absent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const results = await new YouTubeVideoSearchProvider(undefined).search(query);

    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["quota exceeded", vi.fn().mockResolvedValue(new Response(null, { status: 403 }))],
    ["API unavailable", vi.fn().mockRejectedValue(new Error("network down"))],
  ])("returns an empty fallback when %s", async (_reason, fetchMock) => {
    vi.stubGlobal("fetch", fetchMock);

    const results = await new YouTubeVideoSearchProvider("secret").search(query);

    expect(results).toEqual([]);
  });

  function itemsResponse(channelTitles: string[]) {
    return new Response(
      JSON.stringify({
        items: channelTitles.map((channelTitle, i) => ({
          id: { videoId: `v${i}` },
          snippet: { title: `Video ${i}`, channelTitle, thumbnails: { medium: { url: `https://img/${i}.jpg` } } },
        })),
      }),
    );
  }

  it("boosts a preferred BJJ channel into the #2 slot for a grappling discipline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(itemsResponse(["Random Gym", "Some Other Channel", "Gordon Ryan"])),
    );

    const results = await new YouTubeVideoSearchProvider("secret").search({
      technique: "Armbar",
      difficulty: "",
      discipline: "BJJ",
    });

    expect(results.map((r) => r.channelTitle)).toEqual(["Random Gym", "Gordon Ryan", "Some Other Channel"]);
  });

  it("boosts a preferred MMA channel for a striking discipline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(itemsResponse(["Random Gym", "Some Other Channel", "MMA Shredded"])),
    );

    const results = await new YouTubeVideoSearchProvider("secret").search({
      technique: "Jab",
      difficulty: "",
      discipline: "MMA",
    });

    expect(results.map((r) => r.channelTitle)).toEqual(["Random Gym", "MMA Shredded", "Some Other Channel"]);
  });

  it("never boosts a channel from the wrong discipline family", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(itemsResponse(["Random Gym", "Some Other Channel", "MMA Shredded"])),
    );

    const results = await new YouTubeVideoSearchProvider("secret").search({
      technique: "Armbar",
      difficulty: "",
      discipline: "BJJ",
    });

    expect(results.map((r) => r.channelTitle)).toEqual(["Random Gym", "Some Other Channel", "MMA Shredded"]);
  });

  it("leaves the order untouched when the preferred channel is already #1", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(itemsResponse(["Gordon Ryan", "Random Gym", "Some Other Channel"])),
    );

    const results = await new YouTubeVideoSearchProvider("secret").search({
      technique: "Armbar",
      difficulty: "",
      discipline: "BJJ",
    });

    expect(results.map((r) => r.channelTitle)).toEqual(["Gordon Ryan", "Random Gym", "Some Other Channel"]);
  });
});
