"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CheckIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GOAL_HORIZON_LABELS, GOAL_STATUS_LABELS } from "@/lib/domain/knowledge";
import { deleteGoal, updateGoalStatus, type GoalListItem } from "@/lib/usecases/goals-actions";

function relativeDueDate(iso: string): { text: string; overdue: boolean } {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `En retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? "s" : ""}`, overdue: true };
  if (days === 0) return { text: "Échéance aujourd'hui", overdue: false };
  return { text: `Échéance dans ${days} jour${days > 1 ? "s" : ""}`, overdue: false };
}

export function GoalRow({ goal }: { goal: GoalListItem }) {
  const [isPending, startTransition] = useTransition();
  const due = goal.due_date ? relativeDueDate(goal.due_date) : null;

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{goal.title}</span>
            <Badge variant="outline">{GOAL_HORIZON_LABELS[goal.horizon]}</Badge>
            <Badge variant={goal.status === "active" ? "secondary" : "outline"}>
              {GOAL_STATUS_LABELS[goal.status]}
            </Badge>
          </div>
          {goal.description ? <p className="text-sm text-muted-foreground">{goal.description}</p> : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {goal.skill ? (
              <Link href={`/skills/${goal.skill.id}`} className="hover:underline">
                {goal.skill.name}
              </Link>
            ) : null}
            {due ? <span className={due.overdue ? "text-destructive" : undefined}>{due.text}</span> : null}
          </div>
        </div>
        {goal.status === "active" ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Marquer atteint"
              disabled={isPending}
              onClick={() => startTransition(() => updateGoalStatus(goal.id, "done"))}
            >
              <CheckIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Abandonner"
              disabled={isPending}
              onClick={() => startTransition(() => updateGoalStatus(goal.id, "abandoned"))}
            >
              <XIcon />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => deleteGoal(goal.id))}
          >
            Supprimer
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
