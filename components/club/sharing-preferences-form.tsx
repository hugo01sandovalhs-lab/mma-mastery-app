"use client";

import { useActionState } from "react";
import { CLUB_SHARING_CATEGORIES, type ClubSharingPreferences } from "@/lib/domain/club";
import { updateClubSharingPreferences } from "@/lib/usecases/club-actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

const LABELS = {
  skills: "Progression des compétences",
  training: "Séances d'entraînement",
  sparring: "Sparring",
  difficulties: "Difficultés et questions",
  goals: "Objectifs",
  youtube: "Recherches et notes YouTube",
} as const;

export function SharingPreferencesForm({ clubId, preferences }: { clubId: string; preferences: ClubSharingPreferences }) {
  const [state, action, pending] = useActionState(updateClubSharingPreferences, { error: null });
  const { t } = useI18n();
  return (
    <form action={action} className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <input type="hidden" name="club_id" value={clubId} />
      <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 font-heading text-lg font-semibold">{t("club.sharing.title", "Partager ma progression")}</legend>
        <p className="col-span-full text-sm text-muted-foreground">
          {t("club.sharing.description", "Vous choisissez précisément ce que les coachs de ce club peuvent consulter. Vous pouvez retirer cet accès à tout moment.")}
        </p>
        {CLUB_SHARING_CATEGORIES.map((category) => (
          <label key={category} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            <input type="checkbox" name={category} defaultChecked={preferences[category]} className="size-4 accent-primary" />
            {t(`club.sharing.${category}`, LABELS[category])}
          </label>
        ))}
      </fieldset>
      {state.error ? <p role="alert" className="mt-3 text-sm text-destructive">{state.error}</p> : null}
      {state.saved ? <p role="status" className="mt-3 text-sm text-primary">{t("club.sharing.saved", "Préférences enregistrées.")}</p> : null}
      <Button type="submit" disabled={pending} className="mt-4 min-h-11">
        {pending ? t("action.saving", "Enregistrement…") : t("club.sharing.save", "Enregistrer le partage")}
      </Button>
    </form>
  );
}
