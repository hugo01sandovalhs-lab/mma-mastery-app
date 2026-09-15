"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSequence, type CompetitionActionState } from "@/lib/usecases/competition-actions";
import type { SkillListItem } from "@/lib/usecases/skill-actions";

export function SequenceForm({ matchId, skills }: { matchId: string; skills: SkillListItem[] }) {
  const initialState: CompetitionActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createSequence, initialState);
  const [resolvedSkillId, setResolvedSkillId] = useState("");
  const skillByName = new Map(skills.map((s) => [s.name.trim().toLowerCase(), s.id]));

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <input type="hidden" name="match_id" value={matchId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="seq_title">Titre</Label>
          <Input id="seq_title" name="title" required maxLength={160} placeholder="Passage de garde étape 2" />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="seq_url">Lien vidéo (optionnel)</Label>
          <Input id="seq_url" name="source_url" type="url" placeholder="https://..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seq_start">Début (secondes, optionnel)</Label>
          <Input id="seq_start" name="timestamp_start" type="number" min={0} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seq_end">Fin (secondes, optionnel)</Label>
          <Input id="seq_end" name="timestamp_end" type="number" min={0} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="seq_skill">Compétence liée (optionnel)</Label>
          <Input
            id="seq_skill"
            list="seq-skills-datalist"
            placeholder="Rechercher une compétence"
            onChange={(e) => setResolvedSkillId(skillByName.get(e.target.value.trim().toLowerCase()) ?? "")}
          />
          <datalist id="seq-skills-datalist">
            {skills.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
          <input type="hidden" name="skill_id" value={resolvedSkillId} />
        </div>
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          Ajouter la séquence
        </Button>
      </div>
    </form>
  );
}
