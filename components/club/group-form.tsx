"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroup, type ClubActionState } from "@/lib/usecases/club-actions";
import { useI18n } from "@/components/i18n-provider";

export function GroupForm({ clubId }: { clubId: string }) {
  const { t } = useI18n();
  const initialState: ClubActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createGroup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="club_id" value={clubId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="group_name">{t("club.groupName", "Nom du groupe")}</Label>
          <Input id="group_name" name="name" maxLength={120} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="group_level">{t("club.levelOptional", "Niveau (optionnel)")}</Label>
          <Input id="group_level" name="level" maxLength={80} placeholder={t("club.levelPlaceholder", "Débutant, Compétition...")} />
        </div>
      </div>
      {state.error ? <p role="alert" className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("club.createGroupBtn", "Créer le groupe")}
        </Button>
      </div>
    </form>
  );
}
