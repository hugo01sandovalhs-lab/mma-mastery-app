"use client";

import { useTransition } from "react";
import Link from "next/link";
import { TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WEEKDAY_LABELS } from "@/lib/domain/class";
import { deleteClass, type ClassListItem } from "@/lib/usecases/class-actions";

export function ClassRow({
  cls,
  clubId,
  canManage,
}: {
  cls: ClassListItem;
  clubId: string;
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <Link href={`/club/${clubId}/classes/${cls.id}`} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="font-medium">{cls.name}</span>
          {cls.group_name ? <Badge variant="outline">{cls.group_name}</Badge> : null}
          {cls.day_of_week !== null ? (
            <span className="text-sm text-muted-foreground">
              {WEEKDAY_LABELS[cls.day_of_week]}
              {cls.start_time ? ` · ${cls.start_time.slice(0, 5)}` : ""}
            </span>
          ) : null}
        </Link>
        {canManage ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Supprimer le cours"
            disabled={isPending}
            onClick={() => startTransition(() => deleteClass(cls.id, clubId))}
          >
            <TrashIcon />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
