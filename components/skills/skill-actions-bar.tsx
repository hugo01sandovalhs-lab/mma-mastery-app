"use client";

import { useState, useTransition } from "react";
import { BookmarkIcon, FlagIcon, ListPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { useI18n } from "@/components/i18n-provider";
import { addToStudyQueue, toggleBookmark } from "@/lib/usecases/knowledge-actions";
import { quickAddGoalFromSkill } from "@/lib/usecases/goals-actions";

export function SkillActionsBar({
  skillId,
  skillName,
  initiallyBookmarked,
  alreadyQueued,
  alreadyGoaled,
}: {
  skillId: string;
  skillName: string;
  initiallyBookmarked: boolean;
  alreadyQueued: boolean;
  alreadyGoaled: boolean;
}) {
  const { t } = useI18n();
  const [isBookmarkPending, startBookmarkTransition] = useTransition();
  const [isQueuePending, startQueueTransition] = useTransition();
  const [isGoalPending, startGoalTransition] = useTransition();
  const [goaled, setGoaled] = useState(alreadyGoaled);
  const path = `/skills/${skillId}`;

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isBookmarkPending}
        onClick={() => startBookmarkTransition(() => toggleBookmark("skill", skillId, path))}
      >
        <BookmarkIcon className={cn(initiallyBookmarked && "fill-current")} />
        {initiallyBookmarked ? t("action.favorited", "Favori") : t("action.favorite", "Ajouter aux favoris")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isQueuePending || alreadyQueued}
        onClick={() => startQueueTransition(() => addToStudyQueue(skillId, path))}
      >
        <ListPlusIcon /> {alreadyQueued ? t("study.inQueue", "Dans la file d'étude") : t("study.addToQueue", "Ajouter à la file d'étude")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isGoalPending || goaled}
        onClick={() =>
          startGoalTransition(async () => {
            await quickAddGoalFromSkill(skillId, skillName, path);
            setGoaled(true);
          })
        }
      >
        <FlagIcon /> {goaled ? t("action.addedGoal", "Ajouté aux objectifs") : t("action.addGoal", "Ajouter aux objectifs")}
      </Button>
    </div>
  );
}
