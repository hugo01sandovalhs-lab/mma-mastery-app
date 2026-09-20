"use client";

import { useState, useTransition } from "react";
import { ListPlusIcon, FlagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { addToStudyQueue } from "@/lib/usecases/knowledge-actions";
import { quickAddGoalFromSkill } from "@/lib/usecases/goals-actions";

/**
 * Lightweight Study/Add-goal actions for skill mentions outside the skill
 * detail page (Technique of the Day card, search results) — no pre-check
 * queries (isInStudyQueue/getGoals) since these are supplementary/list
 * contexts, not the skill detail page itself; both underlying actions are
 * cheap to call again (study queue upserts, and the local "done" state below
 * prevents an accidental duplicate goal from a second click in the same view).
 */
export function SkillQuickActions({ skillId, skillName, path }: { skillId: string; skillName: string; path: string }) {
  const { t } = useI18n();
  const [isQueuePending, startQueueTransition] = useTransition();
  const [isGoalPending, startGoalTransition] = useTransition();
  const [queued, setQueued] = useState(false);
  const [goaled, setGoaled] = useState(false);

  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={isQueuePending || queued}
        onClick={() =>
          startQueueTransition(async () => {
            await addToStudyQueue(skillId, path);
            setQueued(true);
          })
        }
      >
        <ListPlusIcon /> {queued ? t("study.inQueue", "Dans la file d'étude") : t("study.addToQueue", "Ajouter à la file d'étude")}
      </Button>
      <Button
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
