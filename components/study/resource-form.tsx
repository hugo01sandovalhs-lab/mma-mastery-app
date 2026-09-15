"use client";

import { useActionState, useRef, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RESOURCE_TYPES, RESOURCE_TYPE_LABELS } from "@/lib/domain/knowledge";
import { createResource, type KnowledgeActionState } from "@/lib/usecases/knowledge-actions";
import type { SkillListItem } from "@/lib/usecases/skill-actions";

type ResourceFormProps = {
  skills: SkillListItem[];
  /** Pre-fills and hides the skill picker when adding a resource from a skill's own page. */
  fixedSkillId?: string;
};

export function ResourceForm({ skills, fixedSkillId }: ResourceFormProps) {
  const initialState: KnowledgeActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createResource, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [resolvedSkillId, setResolvedSkillId] = useState("");
  const skillByName = new Map(skills.map((s) => [s.name.trim().toLowerCase(), s.id]));

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const result = await formAction(formData);
        formRef.current?.reset();
        return result;
      }}
      className="flex flex-col gap-3 rounded-lg border border-border p-4"
    >
      {fixedSkillId ? <input type="hidden" name="skill_id" value={fixedSkillId} /> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="resource_type">Type</Label>
          <Select
            name="type"
            defaultValue="video"
            items={RESOURCE_TYPES.map((t) => ({ value: t, label: RESOURCE_TYPE_LABELS[t] }))}
          >
            <SelectTrigger id="resource_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {RESOURCE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="resource_title">Titre</Label>
          <Input id="resource_title" name="title" required maxLength={160} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="resource_url">URL</Label>
          <Input id="resource_url" name="url" type="url" required placeholder="https://..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="resource_author">Auteur / chaîne (optionnel)</Label>
          <Input id="resource_author" name="author" maxLength={120} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="resource_timestamp">Timestamp vidéo, secondes (optionnel)</Label>
          <Input id="resource_timestamp" name="timestamp_seconds" type="number" min={0} />
        </div>
        {!fixedSkillId ? (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="resource_skill">Compétence liée (optionnel)</Label>
            <Input
              id="resource_skill"
              list="resource-skills-datalist"
              placeholder="Rechercher une compétence"
              onChange={(e) => setResolvedSkillId(skillByName.get(e.target.value.trim().toLowerCase()) ?? "")}
            />
            <datalist id="resource-skills-datalist">
              {skills.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
            <input type="hidden" name="skill_id" value={resolvedSkillId} />
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="resource_notes">Notes (optionnel)</Label>
          <Textarea id="resource_notes" name="notes" rows={2} />
        </div>
      </div>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          <PlusIcon /> Ajouter la ressource
        </Button>
      </div>
    </form>
  );
}

