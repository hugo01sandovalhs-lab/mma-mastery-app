"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CheckIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { STUDY_STATUS_LABEL_KEYS, type StudyStatus } from "@/lib/domain/knowledge";
import {
  removeFromStudyQueue,
  updateStudyStatus,
  type StudyQueueItem,
} from "@/lib/usecases/knowledge-actions";
import { useI18n } from "@/components/i18n-provider";

const NEXT_STATUS: Record<StudyStatus, StudyStatus | null> = {
  queued: "studying",
  studying: "studied",
  studied: null,
};

export function StudyQueueItemRow({ item }: { item: StudyQueueItem }) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const next = NEXT_STATUS[item.status];

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link href={item.skill ? `/skills/${item.skill.id}` : "#"} className="font-medium hover:underline">
            {item.skill?.name ?? t("studyQueueItem.deletedSkill", "Compétence supprimée")}
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{t(STUDY_STATUS_LABEL_KEYS[item.status])}</Badge>
            {item.skill?.discipline ? (
              <span className="text-xs text-muted-foreground">{item.skill.discipline.name}</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {next ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => startTransition(() => updateStudyStatus(item.id, next, "/study"))}
            >
              <CheckIcon /> {t(STUDY_STATUS_LABEL_KEYS[next])}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => startTransition(() => updateStudyStatus(item.id, "queued", "/study"))}
            >
              <RotateCcwIcon /> {t("studyQueueItem.requeue", "Remettre en file")}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("studyQueueItem.removeAria", "Retirer de la file")}
            disabled={isPending}
            onClick={() => startTransition(() => removeFromStudyQueue(item.id, "/study"))}
          >
            <Trash2Icon />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
