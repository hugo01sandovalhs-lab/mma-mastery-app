import { z } from "zod";

/**
 * Club announcements (docs/decisions/0007, P4.2): a coach-authored post
 * targeted at the whole club or one group. No chat, no email, no push --
 * read via normal page load. Unread state is a single per-membership
 * timestamp (`club_members.announcements_last_read_at`), not a
 * per-announcement read table.
 */

export const clubAnnouncementInputSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(160),
  content: z.string().trim().min(1, "Contenu requis").max(4000),
  group_id: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type ClubAnnouncementInput = z.infer<typeof clubAnnouncementInputSchema>;

export function isUnread(createdAt: string, lastReadAt: string | null): boolean {
  if (!lastReadAt) return true;
  return new Date(createdAt).getTime() > new Date(lastReadAt).getTime();
}
