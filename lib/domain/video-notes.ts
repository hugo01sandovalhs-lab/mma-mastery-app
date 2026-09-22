/**
 * Video-analysis notes reuse the existing `resources` table (url/title/
 * author/skill_id/timestamp_seconds/notes) as-is — one note = one
 * `resources` row of type "video" sharing the video's url. There is no
 * dedicated "note kind" column (adding one would be a migration, out of
 * scope without an explicit request), so the kind is encoded as a
 * `[kind]` prefix inside the existing free-text `notes` field. Decoding
 * degrades gracefully: any pre-existing/unprefixed note (favorites saved
 * before this feature, or plain resource notes) just renders as-is with
 * no kind badge.
 */
export const VIDEO_NOTE_KINDS = ["detail", "timing", "error", "toTest"] as const;
export type VideoNoteKind = (typeof VIDEO_NOTE_KINDS)[number];

const KIND_PREFIX_RE = /^\[(detail|timing|error|toTest)\]\s?/;

export function encodeVideoNote(kind: VideoNoteKind, text: string): string {
  return `[${kind}] ${text.trim()}`;
}

export function decodeVideoNote(raw: string): { kind: VideoNoteKind | null; text: string } {
  const match = raw.match(KIND_PREFIX_RE);
  if (!match) return { kind: null, text: raw };
  return { kind: match[1] as VideoNoteKind, text: raw.slice(match[0].length) };
}

export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
