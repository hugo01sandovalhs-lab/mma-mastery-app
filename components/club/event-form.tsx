"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVENT_TYPES, EVENT_TYPE_LABEL_KEYS } from "@/lib/domain/club-event";
import { createClubEvent, type ClubEventActionState } from "@/lib/usecases/club-event-actions";
import { useI18n } from "@/components/i18n-provider";

const nativeSelectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function EventForm({ clubId }: { clubId: string }) {
  const { t } = useI18n();
  const initialState: ClubEventActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createClubEvent, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="club_id" value={clubId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event_name">{t("club.eventName", "Nom de l'événement")}</Label>
          <Input id="event_name" name="name" maxLength={160} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event_type">{t("club.eventTypeLabel", "Type")}</Label>
          <select id="event_type" name="event_type" defaultValue="event" className={nativeSelectClassName}>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(EVENT_TYPE_LABEL_KEYS[type])}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event_starts_at">{t("club.eventDateTime", "Date et heure")}</Label>
          <Input id="event_starts_at" name="starts_at" type="datetime-local" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event_location">{t("club.locationOptional", "Lieu (optionnel)")}</Label>
          <Input id="event_location" name="location" maxLength={160} />
        </div>
      </div>
      {state.error ? <p role="alert" className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("club.createEventBtn", "Créer l'événement")}
        </Button>
      </div>
    </form>
  );
}
