"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelRegistration, registerForEvent } from "@/lib/usecases/club-event-actions";

export function EventRegistrationButton({
  eventId,
  clubId,
  isRegistered,
}: {
  eventId: string;
  clubId: string;
  isRegistered: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (isRegistered) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => cancelRegistration(eventId, clubId))}
      >
        Se désinscrire
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => registerForEvent(eventId, clubId))}
    >
      S&apos;inscrire
    </Button>
  );
}
