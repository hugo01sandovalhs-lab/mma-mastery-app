"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Copy, UserPlus, Users, X } from "lucide-react";
import { addTrainingPartner, removeTrainingPartner } from "@/app/(app)/profile/actions";
import type { TrainingPartner } from "@/lib/domain/training-partner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n-provider";

export function TrainingPartners({ friendCode, partners }: { friendCode: string; partners: TrainingPartner[] }) {
  const [state, action, pending] = useActionState(addTrainingPartner, { error: null, saved: false });
  const [copied, setCopied] = useState(false);
  const [removing, startTransition] = useTransition();
  const { t } = useI18n();

  async function copyCode() {
    await navigator.clipboard.writeText(friendCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("profile.partners.title", "Partenaires d’entraînement")}</CardTitle></CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <div className="grid gap-2">
            <Label>{t("profile.friendCode.label", "Votre code ami")}</Label>
            <div className="flex gap-2">
              <Input value={friendCode} readOnly aria-label={t("profile.friendCode.label", "Votre code ami")} className="font-mono tracking-[0.2em]" />
              <Button type="button" variant="outline" onClick={copyCode} disabled={!friendCode}>
                {copied ? <Check /> : <Copy />}{copied ? t("action.copied", "Copié") : t("action.copyFriendCode", "Copier")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("profile.friendCode.hint", "Ce code révèle uniquement votre nom d’affichage après ajout.")}</p>
          </div>
          <form action={action} className="grid gap-2">
            <Label htmlFor="friend_code">{t("profile.partners.addByCode", "Ajouter par code")}</Label>
            <div className="flex gap-2">
              <Input id="friend_code" name="friend_code" required maxLength={9} placeholder="AB12CD34" autoComplete="off" />
              <Button type="submit" disabled={pending}><UserPlus />{pending ? t("profile.partners.adding", "Ajout…") : t("profile.partners.add", "Ajouter")}</Button>
            </div>
            {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
            {state.saved ? <p role="status" className="text-sm text-emerald-700">{t("profile.partners.added", "Partenaire ajouté.")}</p> : null}
          </form>
        </div>
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Users className="size-4" />
            {t(partners.length === 1 ? "profile.partners.count" : "profile.partners.countPlural", `${partners.length} partenaire${partners.length === 1 ? "" : "s"}`, { count: partners.length })}
          </p>
          {partners.length ? (
            <ul className="divide-y rounded-md border">
              {partners.map((partner) => (
                <li key={partner.relationshipId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="text-sm font-medium">{partner.displayName}</span>
                  <Button type="button" size="icon" variant="ghost" disabled={removing} aria-label={t("profile.partners.remove", `Supprimer ${partner.displayName}`, { name: partner.displayName })} onClick={() => startTransition(() => removeTrainingPartner(partner.relationshipId))}>
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          ) : <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{t("profile.partners.empty", "Ajoutez votre premier partenaire avec son code ami.")}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
