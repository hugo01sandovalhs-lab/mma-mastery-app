"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GOAL_HORIZONS, GOAL_HORIZON_LABEL_KEYS } from "@/lib/domain/knowledge";
import { createGoal, type GoalActionState } from "@/lib/usecases/goals-actions";
import type { SkillListItem } from "@/lib/usecases/skill-actions";
import { useI18n } from "@/components/i18n-provider";

export function GoalForm({ skills }: { skills: SkillListItem[] }) {
  const { t } = useI18n();
  const initialState: GoalActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createGoal, initialState);
  const [resolvedSkillId, setResolvedSkillId] = useState("");
  const skillByName = new Map(skills.map((s) => [s.name.trim().toLowerCase(), s.id]));

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal_title">{t("goalForm.title", "Titre")}</Label>
          <Input id="goal_title" name="title" required maxLength={160} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal_horizon">{t("goalForm.horizon", "Horizon")}</Label>
          <Select
            name="horizon"
            defaultValue="short"
            items={GOAL_HORIZONS.map((h) => ({ value: h, label: t(GOAL_HORIZON_LABEL_KEYS[h]) }))}
          >
            <SelectTrigger id="goal_horizon" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_HORIZONS.map((h) => (
                <SelectItem key={h} value={h}>
                  {t(GOAL_HORIZON_LABEL_KEYS[h])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal_due_date">{t("goalForm.dueDate", "Échéance (optionnel)")}</Label>
          <Input id="goal_due_date" name="due_date" type="date" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal_skill">{t("goalForm.skill", "Compétence liée (optionnel)")}</Label>
          <Input
            id="goal_skill"
            list="goal-skills-datalist"
            placeholder={t("goalForm.skillPlaceholder", "Rechercher une compétence")}
            onChange={(e) => setResolvedSkillId(skillByName.get(e.target.value.trim().toLowerCase()) ?? "")}
          />
          <datalist id="goal-skills-datalist">
            {skills.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
          <input type="hidden" name="skill_id" value={resolvedSkillId} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="goal_description">{t("goalForm.description", "Description (optionnel)")}</Label>
          <Textarea id="goal_description" name="description" rows={2} />
        </div>
      </div>
      {state.error ? <p role="alert" className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("goalForm.submit", "Ajouter l'objectif")}
        </Button>
      </div>
    </form>
  );
}
