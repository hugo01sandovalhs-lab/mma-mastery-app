"use client";

import { useTransition } from "react";
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLUB_ROLES, CLUB_ROLE_LABELS, type ClubRole } from "@/lib/domain/club";
import { removeMember, updateMemberRole, type ClubMemberItem } from "@/lib/usecases/club-actions";

// Role change here is capped at ADMIN: promoting to OWNER isn't a role
// change, it's an ownership transfer, out of scope for this lot.
const MAX_ASSIGNABLE_ROLE: ClubRole = "ADMIN";

export function MemberRow({
  member,
  clubId,
  canManage,
}: {
  member: ClubMemberItem;
  clubId: string;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isOwner = member.role === "OWNER";
  const roleIndex = CLUB_ROLES.indexOf(member.role);
  const maxIndex = CLUB_ROLES.indexOf(MAX_ASSIGNABLE_ROLE);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium">{member.display_name ?? "Membre"}</span>
        <Badge variant="outline" className="w-fit">
          {CLUB_ROLE_LABELS[member.role]}
        </Badge>
      </div>
      {canManage && !isOwner ? (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Promouvoir"
            disabled={isPending || roleIndex >= maxIndex}
            onClick={() =>
              startTransition(() => updateMemberRole(member.id, clubId, CLUB_ROLES[roleIndex + 1]))
            }
          >
            <ChevronUpIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Rétrograder"
            disabled={isPending || roleIndex <= 0}
            onClick={() =>
              startTransition(() => updateMemberRole(member.id, clubId, CLUB_ROLES[roleIndex - 1]))
            }
          >
            <ChevronDownIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Retirer du club"
            disabled={isPending}
            onClick={() => startTransition(() => removeMember(member.id, clubId))}
          >
            <TrashIcon />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
