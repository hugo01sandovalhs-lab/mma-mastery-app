"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createClubAnnouncement,
  updateClubAnnouncement,
  type ClubAnnouncementActionState,
} from "@/lib/usecases/club-announcement-actions";
import { useI18n } from "@/components/i18n-provider";

const nativeSelectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

type Group = { id: string; name: string };

export function AnnouncementForm({
  clubId,
  groups,
  announcement,
}: {
  clubId: string;
  groups: Group[];
  announcement?: { id: string; title: string; content: string; group_id: string | null };
}) {
  const { t } = useI18n();
  const initialState: ClubAnnouncementActionState = { error: null };
  const action = announcement ? updateClubAnnouncement : createClubAnnouncement;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="club_id" value={clubId} />
      {announcement ? <input type="hidden" name="announcement_id" value={announcement.id} /> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement_title">{t("club.announcementTitle", "Titre")}</Label>
        <Input id="announcement_title" name="title" maxLength={160} defaultValue={announcement?.title} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement_content">{t("club.announcementContent", "Contenu")}</Label>
        <Textarea id="announcement_content" name="content" rows={4} maxLength={4000} defaultValue={announcement?.content} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement_group">{t("club.recipients", "Destinataires")}</Label>
        <select
          id="announcement_group"
          name="group_id"
          defaultValue={announcement?.group_id ?? ""}
          className={nativeSelectClassName}
        >
          <option value="">{t("club.wholeClub", "Tout le club")}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {announcement ? t("action.save", "Enregistrer") : t("club.publishAnnouncement", "Publier l'annonce")}
        </Button>
      </div>
    </form>
  );
}
