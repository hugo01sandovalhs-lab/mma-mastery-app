"use client";

import { useTransition } from "react";
import Link from "next/link";
import { TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MATCH_RESULT_LABELS } from "@/lib/domain/competition";
import { deleteMatch, type MatchListItem } from "@/lib/usecases/competition-actions";

const RESULT_VARIANT: Record<string, "secondary" | "outline" | "destructive"> = {
  win: "secondary",
  loss: "destructive",
  draw: "outline",
  no_contest: "outline",
};

export function MatchRow({ match }: { match: MatchListItem }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-3">
        <Link href={`/competition/${match.id}`} className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {match.athlete ? `vs ${match.athlete.name}` : match.event_name || "Compétition"}
            </span>
            {match.discipline ? <Badge variant="outline">{match.discipline.name}</Badge> : null}
            {match.result ? (
              <Badge variant={RESULT_VARIANT[match.result]}>{MATCH_RESULT_LABELS[match.result]}</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{new Date(match.date).toLocaleDateString("fr-FR")}</span>
            {match.event_name && match.athlete ? <span>{match.event_name}</span> : null}
            {match.method ? <span>{match.method}</span> : null}
          </div>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Supprimer"
          disabled={isPending}
          onClick={() => startTransition(() => deleteMatch(match.id))}
        >
          <TrashIcon />
        </Button>
      </CardContent>
    </Card>
  );
}
