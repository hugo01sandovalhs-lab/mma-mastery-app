"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLUB_ROLES, CLUB_ROLE_LABELS } from "@/lib/domain/club";
import { inviteMember, type ClubActionState } from "@/lib/usecases/club-actions";
import { useI18n } from "@/components/i18n-provider";

const INVITABLE_ROLES = CLUB_ROLES.filter((r) => r !== "OWNER");

export function InviteForm({ clubId }: { clubId: string }) {
  const { t } = useI18n();
  const initialState: ClubActionState = { error: null };
  const [state, formAction, isPending] = useActionState(inviteMember, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="club_id" value={clubId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite_email">{t("club.invitePartner", "Partenaire ou ami d’entraînement")}</Label>
          <Input id="invite_email" name="email" type="email" required placeholder={t("club.invitePartnerPlaceholder", "Email de son compte MMA Mastery")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite_role">{t("club.role", "Rôle")}</Label>
          <Select name="role" items={INVITABLE_ROLES.map((r) => ({ value: r, label: t(`clubRole.${r}`, CLUB_ROLE_LABELS[r]) }))} defaultValue="MEMBER">
            <SelectTrigger id="invite_role" className="w-40">
              <SelectValue placeholder={t("club.role", "Rôle")} />
            </SelectTrigger>
            <SelectContent>
              {INVITABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`clubRole.${r}`, CLUB_ROLE_LABELS[r])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {state.error ? <p role="alert" className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("club.addPartner", "Ajouter comme partenaire")}
        </Button>
      </div>
    </form>
  );
}
