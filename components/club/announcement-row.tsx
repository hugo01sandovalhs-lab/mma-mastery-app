"use client";

import { useTransition } from "react";
import Link from "next/link";
import { TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteClubAnnouncement, type ClubAnnouncementListItem } from "@/lib/usecases/club-announcement-actions";
import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";

const INTL_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ru: "ru-RU", ja: "ja-JP" };

export function AnnouncementRow({
  announcement,
  clubId,
  canManage,
}: {
  announcement: ClubAnnouncementListItem;
  clubId: string;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useI18n();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <Link href={`/club/${clubId}/announcements/${announcement.id}`} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {announcement.unread ? <span className="size-2 shrink-0 rounded-full bg-primary" aria-label={t("club.unread", "Non lu")} /> : null}
            <span className="truncate font-medium hover:underline">{announcement.title}</span>
            <Badge variant="outline">{announcement.group_name ?? t("club.wholeClub", "Tout le club")}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              {new Date(announcement.created_at).toLocaleString(INTL_LOCALE[locale], { dateStyle: "medium", timeStyle: "short" })}
            </span>
            {announcement.author_name ? <span>{announcement.author_name}</span> : null}
          </div>
        </Link>
        {canManage ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("club.deleteAnnouncement", "Supprimer l'annonce")}
            disabled={isPending}
            onClick={() => startTransition(() => deleteClubAnnouncement(announcement.id, clubId))}
          >
            <TrashIcon />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
