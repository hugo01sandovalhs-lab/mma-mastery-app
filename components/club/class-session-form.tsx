"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClassSession, type ClassActionState } from "@/lib/usecases/class-actions";
import { useI18n } from "@/components/i18n-provider";

export function ClassSessionForm({ clubId, classId }: { clubId: string; classId: string }) {
  const { t } = useI18n();
  const initialState: ClassActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createClassSession, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="club_id" value={clubId} />
      <input type="hidden" name="class_id" value={classId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session_starts_at">{t("club.sessionStart", "Début")}</Label>
          <Input id="session_starts_at" name="starts_at" type="datetime-local" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session_ends_at">{t("club.sessionEndOptional", "Fin (optionnel)")}</Label>
          <Input id="session_ends_at" name="ends_at" type="datetime-local" />
        </div>
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("club.addSessionBtn", "Ajouter une séance")}
        </Button>
      </div>
    </form>
  );
}
