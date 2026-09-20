"use client";

import { useTransition } from "react";
import Link from "next/link";
import { TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WEEKDAY_LABELS } from "@/lib/domain/class";
import { deleteClass, type ClassListItem } from "@/lib/usecases/class-actions";
import { useI18n } from "@/components/i18n-provider";

const WEEKDAY_KEYS = ["weekday.0", "weekday.1", "weekday.2", "weekday.3", "weekday.4", "weekday.5", "weekday.6"] as const;

export function ClassRow({
  cls,
  clubId,
  canManage,
}: {
  cls: ClassListItem;
  clubId: string;
  canManage: boolean;
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <Link href={`/club/${clubId}/classes/${cls.id}`} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="font-medium">{cls.name}</span>
          {cls.group_name ? <Badge variant="outline">{cls.group_name}</Badge> : null}
          {cls.day_of_week !== null ? (
            <span className="text-sm text-muted-foreground">
              {t(WEEKDAY_KEYS[cls.day_of_week], WEEKDAY_LABELS[cls.day_of_week])}
              {cls.start_time ? ` · ${cls.start_time.slice(0, 5)}` : ""}
            </span>
          ) : null}
        </Link>
        {canManage ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("club.deleteClass", "Supprimer le cours")}
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
