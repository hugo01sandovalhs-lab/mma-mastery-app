"use client";

import { useTransition } from "react";
import Link from "next/link";
import { TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteClubAnnouncement, type ClubAnnouncementListItem } from "@/lib/usecases/club-announcement-actions";

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

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <Link href={`/club/${clubId}/announcements/${announcement.id}`} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {announcement.unread ? <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Non lu" /> : null}
            <span className="truncate font-medium hover:underline">{announcement.title}</span>
            <Badge variant="outline">{announcement.group_name ?? "Tout le club"}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              {new Date(announcement.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
            </span>
            {announcement.author_name ? <span>{announcement.author_name}</span> : null}
          </div>
        </Link>
        {canManage ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Supprimer l'annonce"
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
