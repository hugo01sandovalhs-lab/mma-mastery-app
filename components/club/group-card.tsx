"use client";

import { useState, useTransition } from "react";
import { TrashIcon, UserPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  assignMemberToGroup,
  deleteGroup,
  removeMemberFromGroup,
  type ClubMemberItem,
  type GroupItem,
} from "@/lib/usecases/club-actions";
import { useI18n } from "@/components/i18n-provider";

export function GroupCard({
  group,
  clubId,
  clubMembers,
  canManage,
}: {
  group: GroupItem;
  clubId: string;
  clubMembers: ClubMemberItem[];
  canManage: boolean;
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [selectedUserId, setSelectedUserId] = useState("");

  const groupMemberIds = new Set(group.members.map((m) => m.user_id));
  const assignable = clubMembers.filter((m) => !groupMemberIds.has(m.user_id));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">
          {group.name}
          {group.level ? <span className="ml-2 text-sm font-normal text-muted-foreground">{group.level}</span> : null}
        </CardTitle>
        {canManage ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("club.deleteGroup", "Supprimer le groupe")}
            disabled={isPending}
            onClick={() => startTransition(() => deleteGroup(group.id, clubId))}
          >
            <TrashIcon />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {group.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("club.noMembersInGroup", "Aucun membre dans ce groupe.")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <span
                key={m.user_id}
                className="flex items-center gap-1.5 rounded-full border border-border py-1 pl-3 pr-1 text-sm"
              >
                {m.display_name ?? t("clubRole.MEMBER", "Membre")}
                {canManage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-5"
                    aria-label={t("club.removeFromGroup", "Retirer du groupe")}
                    disabled={isPending}
                    onClick={() => startTransition(() => removeMemberFromGroup(group.id, m.user_id, clubId))}
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                ) : null}
              </span>
            ))}
          </div>
        )}

        {canManage && assignable.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select
              items={assignable.map((m) => ({ value: m.user_id, label: m.display_name ?? t("clubRole.MEMBER", "Membre") }))}
              value={selectedUserId}
              onValueChange={(v) => setSelectedUserId(v as string)}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={t("club.addMemberPlaceholder", "Ajouter un membre")} />
              </SelectTrigger>
              <SelectContent>
                {assignable.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.display_name ?? t("clubRole.MEMBER", "Membre")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || !selectedUserId}
              onClick={() =>
                startTransition(() => {
                  assignMemberToGroup(group.id, selectedUserId, clubId);
                  setSelectedUserId("");
                })
              }
            >
              <UserPlusIcon /> {t("action.add", "Ajouter")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
