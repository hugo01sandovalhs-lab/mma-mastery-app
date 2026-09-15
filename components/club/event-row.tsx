"use client";

import { useTransition } from "react";
import Link from "next/link";
import { TrashIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EVENT_TYPE_LABELS } from "@/lib/domain/club-event";
import { deleteClubEvent, type ClubEventListItem } from "@/lib/usecases/club-event-actions";

export function EventRow({
  event,
  clubId,
  canManage,
}: {
  event: ClubEventListItem;
  clubId: string;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <Link href={`/club/${clubId}/events/${event.id}`} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium hover:underline">{event.name}</span>
            <Badge variant="outline">{EVENT_TYPE_LABELS[event.event_type]}</Badge>
            {event.myStatus === "registered" ? <Badge variant="default">Inscrit</Badge> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              {new Date(event.starts_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
            </span>
            {event.location ? <span>{event.location}</span> : null}
            <span className="inline-flex items-center gap-1">
              <UsersIcon className="size-3" /> {event.registrationCount}
            </span>
          </div>
        </Link>
        {canManage ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Supprimer l'événement"
            disabled={isPending}
            onClick={() => startTransition(() => deleteClubEvent(event.id, clubId))}
          >
            <TrashIcon />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
