import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_PHOTOS } from "@/lib/design/photography";

describe("production photo mapping", () => {
  it("gives each main page an existing, distinct photograph and an explicit crop", () => {
    const photos = Object.values(PAGE_PHOTOS);
    expect(photos).toHaveLength(10);
    expect(new Set(photos.map(({ src }) => src)).size).toBe(photos.length);
    for (const photo of photos) {
      expect(existsSync(join(process.cwd(), "public", photo.src))).toBe(true);
      expect(photo.src).toMatch(/\.jpg$/);
      expect(photo.alt.length).toBeGreaterThan(15);
      expect(photo.position).toMatch(/^\d+% \d+%$/);
    }
  });
});
