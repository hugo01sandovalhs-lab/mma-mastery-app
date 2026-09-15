import { z } from "zod";

/**
 * Club foundation primitives (docs/decisions/0007, P3.1): clubs, members and
 * groups. Owner/role-scoped via RLS (`is_club_member`), reusing `profiles`
 * for display names instead of a parallel member-profile model. Classes,
 * attendance and payments are explicitly out of scope for this lot.
 */

export const CLUB_ROLES = ["MEMBER", "ASSISTANT_COACH", "COACH", "ADMIN", "OWNER"] as const;
export const clubRoleSchema = z.enum(CLUB_ROLES);
export type ClubRole = z.infer<typeof clubRoleSchema>;

export const CLUB_ROLE_LABELS: Record<ClubRole, string> = {
  MEMBER: "Membre",
  ASSISTANT_COACH: "Assistant coach",
  COACH: "Coach",
  ADMIN: "Admin",
  OWNER: "Propriétaire",
};

const CLUB_ROLE_RANK: Record<ClubRole, number> = {
  MEMBER: 0,
  ASSISTANT_COACH: 1,
  COACH: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function hasClubRoleAtLeast(role: ClubRole, min: ClubRole): boolean {
  return CLUB_ROLE_RANK[role] >= CLUB_ROLE_RANK[min];
}

export const clubInputSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
});
export type ClubInput = z.infer<typeof clubInputSchema>;

export const inviteMemberInputSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  role: clubRoleSchema.exclude(["OWNER"]).default("MEMBER"),
});
export type InviteMemberInput = z.infer<typeof inviteMemberInputSchema>;

export const groupInputSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  level: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type GroupInput = z.infer<typeof groupInputSchema>;
