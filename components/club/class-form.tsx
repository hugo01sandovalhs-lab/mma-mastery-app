"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WEEKDAY_LABELS } from "@/lib/domain/class";
import { createClass, type ClassActionState } from "@/lib/usecases/class-actions";
import { useI18n } from "@/components/i18n-provider";

const nativeSelectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const WEEKDAY_KEYS = ["weekday.0", "weekday.1", "weekday.2", "weekday.3", "weekday.4", "weekday.5", "weekday.6"] as const;

export function ClassForm({ clubId, groups }: { clubId: string; groups: { id: string; name: string }[] }) {
  const { t } = useI18n();
  const initialState: ClassActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createClass, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="club_id" value={clubId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class_name">{t("club.className", "Nom du cours")}</Label>
          <Input id="class_name" name="name" maxLength={120} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class_group">{t("club.groupOptional", "Groupe (optionnel)")}</Label>
          <select id="class_group" name="group_id" defaultValue="" className={nativeSelectClassName}>
            <option value="">{t("club.allMembers", "Tous les membres")}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class_day">{t("club.recurringDay", "Jour récurrent (optionnel)")}</Label>
          <select id="class_day" name="day_of_week" defaultValue="" className={nativeSelectClassName}>
            <option value="">{t("club.oneOff", "Ponctuel")}</option>
            {WEEKDAY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {t(WEEKDAY_KEYS[i], label)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class_start_time">{t("club.startTime", "Heure de début")}</Label>
          <Input id="class_start_time" name="start_time" type="time" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class_duration">{t("form.duration", "Durée (minutes)")}</Label>
          <Input id="class_duration" name="duration_minutes" type="number" min={1} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="class_capacity">{t("club.capacityOptional", "Capacité (optionnel)")}</Label>
          <Input id="class_capacity" name="capacity" type="number" min={1} />
        </div>
      </div>
      {state.error ? <p role="alert" className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("club.createClassBtn", "Créer le cours")}
        </Button>
      </div>
    </form>
  );
}
