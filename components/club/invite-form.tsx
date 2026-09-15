"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLUB_ROLES, CLUB_ROLE_LABELS } from "@/lib/domain/club";
import { inviteMember, type ClubActionState } from "@/lib/usecases/club-actions";

const INVITABLE_ROLES = CLUB_ROLES.filter((r) => r !== "OWNER");

export function InviteForm({ clubId }: { clubId: string }) {
  const initialState: ClubActionState = { error: null };
  const [state, formAction, isPending] = useActionState(inviteMember, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="club_id" value={clubId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite_email">Email du membre</Label>
          <Input id="invite_email" name="email" type="email" required placeholder="Doit déjà avoir un compte" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite_role">Rôle</Label>
          <Select name="role" items={INVITABLE_ROLES.map((r) => ({ value: r, label: CLUB_ROLE_LABELS[r] }))} defaultValue="MEMBER">
            <SelectTrigger id="invite_role" className="w-40">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              {INVITABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {CLUB_ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          Ajouter au club
        </Button>
      </div>
    </form>
  );
}
