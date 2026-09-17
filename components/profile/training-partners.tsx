"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Copy, UserPlus, Users, X } from "lucide-react";
import { addTrainingPartner, removeTrainingPartner } from "@/app/(app)/profile/actions";
import type { TrainingPartner } from "@/lib/domain/training-partner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TrainingPartners({ friendCode, partners }: { friendCode: string; partners: TrainingPartner[] }) {
  const [state, action, pending] = useActionState(addTrainingPartner, { error: null, saved: false });
  const [copied, setCopied] = useState(false);
  const [removing, startTransition] = useTransition();

  async function copyCode() {
    await navigator.clipboard.writeText(friendCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Partenaires d’entraînement</CardTitle></CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <div className="grid gap-2">
            <Label>Votre code ami</Label>
            <div className="flex gap-2">
              <Input value={friendCode} readOnly aria-label="Votre code ami" className="font-mono tracking-[0.2em]" />
              <Button type="button" variant="outline" onClick={copyCode} disabled={!friendCode}>
                {copied ? <Check /> : <Copy />}{copied ? "Copié" : "Copier"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Ce code révèle uniquement votre nom d’affichage après ajout.</p>
          </div>
          <form action={action} className="grid gap-2">
            <Label htmlFor="friend_code">Ajouter par code</Label>
            <div className="flex gap-2">
              <Input id="friend_code" name="friend_code" required maxLength={9} placeholder="AB12CD34" autoComplete="off" />
              <Button type="submit" disabled={pending}><UserPlus />{pending ? "Ajout…" : "Ajouter"}</Button>
            </div>
            {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
            {state.saved ? <p role="status" className="text-sm text-emerald-700">Partenaire ajouté.</p> : null}
          </form>
        </div>
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-medium"><Users className="size-4" />{partners.length} partenaire{partners.length === 1 ? "" : "s"}</p>
          {partners.length ? (
            <ul className="divide-y rounded-md border">
              {partners.map((partner) => (
                <li key={partner.relationshipId} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="text-sm font-medium">{partner.displayName}</span>
                  <Button type="button" size="icon" variant="ghost" disabled={removing} aria-label={`Supprimer ${partner.displayName}`} onClick={() => startTransition(() => removeTrainingPartner(partner.relationshipId))}>
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          ) : <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Ajoutez votre premier partenaire avec son code ami.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
