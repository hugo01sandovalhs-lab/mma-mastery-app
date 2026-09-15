"use client";

import { useTransition } from "react";
import Link from "next/link";
import { TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CLUB_ROLE_LABELS } from "@/lib/domain/club";
import { deleteClub, type MyClubListItem } from "@/lib/usecases/club-actions";

export function ClubRow({ club }: { club: MyClubListItem }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <Link href={`/club/${club.id}`} className="flex min-w-0 flex-1 items-center gap-2">
          <span className="font-medium">{club.name}</span>
          <Badge variant="outline">{CLUB_ROLE_LABELS[club.role]}</Badge>
        </Link>
        {club.role === "OWNER" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Supprimer"
            disabled={isPending}
            onClick={() => startTransition(() => deleteClub(club.id))}
          >
            <TrashIcon />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
