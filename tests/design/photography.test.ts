import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LANDING_SLIDES, PAGE_PHOTOS, PHOTO_STORIES } from "@/lib/design/photography";

describe("production photo mapping", () => {
  it("gives each main page an existing, distinct photograph and an explicit crop", () => {
    const photos = Object.values(PAGE_PHOTOS);
    expect(photos).toHaveLength(12);
    expect(PAGE_PHOTOS.calendar).toBeDefined();
    expect(new Set(photos.map(({ src }) => src)).size).toBe(photos.length);
    for (const photo of photos) {
      expect(existsSync(join(process.cwd(), "public", photo.src))).toBe(true);
      expect(photo.src).toMatch(/\.jpg$/);
      expect(photo.alt.length).toBeGreaterThan(15);
      expect(photo.position).toMatch(/^\d+% \d+%$/);
    }
  });

  it("never reuses a production photograph and links the club story cards", () => {
    const stories = Object.values(PHOTO_STORIES).flat();
    const allPhotos = [...Object.values(PAGE_PHOTOS), ...stories, ...LANDING_SLIDES];

    expect(new Set(allPhotos.map(({ src }) => src)).size).toBe(allPhotos.length);
    expect(PHOTO_STORIES.club.map((photo) => photo.href)).toEqual([
      "/club#cours",
      "/club#collectif",
      "/profile#partenaires",
    ]);
    for (const photo of allPhotos) {
      expect(existsSync(join(process.cwd(), "public", photo.src))).toBe(true);
    }
  });
});
