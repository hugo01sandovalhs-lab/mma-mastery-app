"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClub, type ClubActionState } from "@/lib/usecases/club-actions";

export function ClubForm() {
  const initialState: ClubActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createClub, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="club_name">Nom du club</Label>
        <Input id="club_name" name="name" maxLength={120} required />
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          Créer le club
        </Button>
      </div>
    </form>
  );
}
