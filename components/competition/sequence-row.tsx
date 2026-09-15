"use client";

import { useTransition } from "react";
import Link from "next/link";
import { PlayIcon, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteSequence, type SequenceListItem } from "@/lib/usecases/competition-actions";

function formatRange(start: number | null, end: number | null): string | null {
  if (start == null && end == null) return null;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  if (start != null && end != null) return `${fmt(start)} - ${fmt(end)}`;
  return fmt((start ?? end) as number);
}

export function SequenceRow({ sequence, matchId }: { sequence: SequenceListItem; matchId: string }) {
  const [isPending, startTransition] = useTransition();
  const range = formatRange(sequence.timestamp_start, sequence.timestamp_end);

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{sequence.title}</span>
            {sequence.skills.map((s) => (
              <Link key={s.id} href={`/skills/${s.id}`}>
                <Badge variant="secondary">{s.name}</Badge>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {sequence.source_url ? (
              <a
                href={sequence.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                <PlayIcon className="size-3" /> Voir la vidéo
              </a>
            ) : null}
            {range ? <span>{range}</span> : null}
          </div>
          {sequence.notes ? <p className="text-sm text-muted-foreground">{sequence.notes}</p> : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Supprimer"
          disabled={isPending}
          onClick={() => startTransition(() => deleteSequence(sequence.id, matchId))}
        >
          <TrashIcon />
        </Button>
      </CardContent>
    </Card>
  );
}
