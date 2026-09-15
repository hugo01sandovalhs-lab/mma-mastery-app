import { describe, expect, it } from "vitest";
import { clubAnnouncementInputSchema, isUnread } from "@/lib/domain/club-announcement";

describe("clubAnnouncementInputSchema", () => {
  it("accepts a minimal valid announcement targeted at the whole club", () => {
    const result = clubAnnouncementInputSchema.safeParse({ title: "Stage samedi", content: "RDV 9h au dojo." });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.group_id).toBeUndefined();
  });

  it("accepts a group_id target", () => {
    const result = clubAnnouncementInputSchema.safeParse({
      title: "Compétiteurs",
      content: "Pesée demain.",
      group_id: "11111111-1111-1111-1111-111111111111",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.group_id).toBe("11111111-1111-1111-1111-111111111111");
  });

  it("rejects an empty title", () => {
    const result = clubAnnouncementInputSchema.safeParse({ title: "", content: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty content", () => {
    const result = clubAnnouncementInputSchema.safeParse({ title: "x", content: "" });
    expect(result.success).toBe(false);
  });
});

describe("isUnread", () => {
  const created = "2026-09-15T12:00:00.000Z";

  it("treats an announcement as unread when never read", () => {
    expect(isUnread(created, null)).toBe(true);
  });

  it("treats an announcement as unread when created after last read", () => {
    expect(isUnread(created, "2026-09-15T11:00:00.000Z")).toBe(true);
  });

  it("treats an announcement as read when created before last read", () => {
    expect(isUnread(created, "2026-09-15T13:00:00.000Z")).toBe(false);
  });
});
