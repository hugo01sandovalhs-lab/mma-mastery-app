"use client";

import { useActionState, useRef, useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  OBSERVATION_TYPE_LABELS,
  OBSERVATION_TYPES,
  SESSION_TECHNIQUE_OUTCOME_LABELS,
  SESSION_TECHNIQUE_OUTCOMES,
  SESSION_TYPE_LABELS,
  SESSION_TYPES,
  hasRequiredObservation,
  type Discipline,
  type ObservationType,
  type SessionTechniqueInput,
  type SessionType,
} from "@/lib/domain/training";
import type { TrainingActionState } from "@/lib/usecases/training-actions";
import type { TrainingSessionDetail } from "@/lib/usecases/training-actions";
import type { SkillListItem } from "@/lib/usecases/skill-actions";

type ObservationRow = { type: ObservationType; content: string; related_skill_id?: string };

type TrainingFormProps = {
  disciplines: Discipline[];
  skills: SkillListItem[];
  action: (prevState: TrainingActionState, formData: FormData) => Promise<TrainingActionState>;
  initialData?: TrainingSessionDetail;
  submitLabel: string;
};

export function TrainingForm({ disciplines, skills, action, initialData, submitLabel }: TrainingFormProps) {
  const skillByName = new Map(skills.map((s) => [s.name.trim().toLowerCase(), s.id]));
  function resolveSkillId(name: string): string | undefined {
    return skillByName.get(name.trim().toLowerCase());
  }
  const initialState: TrainingActionState = { error: null };
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [sessionType, setSessionType] = useState<SessionType>(initialData?.session_type ?? "class");
  const isSparring = sessionType === "sparring";

  const [techniques, setTechniques] = useState<SessionTechniqueInput[]>(
    initialData?.techniques.map((t) => ({
      technique_name: t.technique_name,
      skill_id: t.skill_id ?? undefined,
      category: t.category ?? undefined,
      notes: t.notes ?? undefined,
      outcome: t.outcome ?? undefined,
      partner_name: t.partner_name ?? undefined,
      pressure_level: t.pressure_level ?? undefined,
      problem: t.problem ?? undefined,
    })) ?? [],
  );
  const [observations, setObservations] = useState<ObservationRow[]>(
    initialData?.observations.map((o) => ({
      type: o.type,
      content: o.content,
      related_skill_id: o.related_skill_id ?? undefined,
    })) ?? [{ type: "difficulty", content: "" }],
  );

  const techniquesJsonRef = useRef<HTMLInputElement>(null);
  const observationsJsonRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    if (techniquesJsonRef.current) {
      techniquesJsonRef.current.value = JSON.stringify(
        techniques.filter((t) => t.technique_name.trim().length > 0),
      );
    }
    if (observationsJsonRef.current) {
      observationsJsonRef.current.value = JSON.stringify(
        observations.filter((o) => o.content.trim().length > 0),
      );
    }
  }

  const missingRequiredObservation = !hasRequiredObservation(
    observations.filter((o) => o.content.trim().length > 0),
  );

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-6">
      <input ref={techniquesJsonRef} type="hidden" name="techniques_json" />
      <input ref={observationsJsonRef} type="hidden" name="observations_json" />
      <datalist id="skills-datalist">
        {skills.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>

      <Card>
        <CardHeader>
          <CardTitle>Séance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={initialData?.date ?? new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="discipline_id">Discipline</Label>
            <Select
              name="discipline_id"
              defaultValue={initialData?.discipline.id}
              items={disciplines.map((d) => ({ value: d.id, label: d.name }))}
            >
              <SelectTrigger id="discipline_id" className="w-full">
                <SelectValue placeholder="Choisir une discipline" />
              </SelectTrigger>
              <SelectContent>
                {disciplines.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="session_type">Type de séance</Label>
            <Select
              name="session_type"
              value={sessionType}
              onValueChange={(value) => setSessionType(value as SessionType)}
              items={SESSION_TYPES.map((t) => ({ value: t, label: SESSION_TYPE_LABELS[t] }))}
            >
              <SelectTrigger id="session_type" className="w-full">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {SESSION_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="duration_minutes">Durée (minutes)</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min={1}
              max={1000}
              defaultValue={initialData?.duration_minutes ?? undefined}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titre / résumé</Label>
            <Input
              id="title"
              name="title"
              maxLength={120}
              defaultValue={initialData?.title ?? ""}
              placeholder="Ex: Sparring léger, focus garde"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rpe">RPE (1-10)</Label>
            <Input
              id="rpe"
              name="rpe"
              type="number"
              min={1}
              max={10}
              defaultValue={initialData?.rpe ?? undefined}
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={initialData?.notes ?? ""} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Techniques travaillées</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setTechniques((prev) => [
                ...prev,
                {
                  technique_name: "",
                  category: "",
                  notes: "",
                  outcome: undefined,
                  partner_name: "",
                  pressure_level: undefined,
                  problem: "",
                },
              ])
            }
          >
            <PlusIcon /> Ajouter
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {techniques.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune technique ajoutée.</p>
          ) : null}
          {techniques.map((t, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-start">
              <div className="flex flex-1 flex-col gap-2">
                <Input
                  aria-label="Nom de la technique"
                  placeholder="Rechercher une compétence ou saisir un nom libre"
                  list="skills-datalist"
                  value={t.technique_name}
                  onChange={(e) => {
                    const technique_name = e.target.value;
                    setTechniques((prev) =>
                      prev.map((row, idx) =>
                        idx === i
                          ? { ...row, technique_name, skill_id: resolveSkillId(technique_name) }
                          : row,
                      ),
                    );
                  }}
                />
                {t.skill_id ? (
                  <p className="text-muted-foreground text-xs">Compétence du catalogue liée.</p>
                ) : null}
                <Input
                  aria-label="Catégorie"
                  placeholder="Catégorie (optionnel)"
                  value={t.category ?? ""}
                  onChange={(e) =>
                    setTechniques((prev) =>
                      prev.map((row, idx) => (idx === i ? { ...row, category: e.target.value } : row)),
                    )
                  }
                />
                {isSparring ? (
                  <div className="grid grid-cols-1 gap-2 border-t border-border pt-2 sm:grid-cols-2">
                    <Select
                      value={t.outcome ?? "__none"}
                      onValueChange={(value) =>
                        setTechniques((prev) =>
                          prev.map((row, idx) =>
                            idx === i
                              ? { ...row, outcome: value === "__none" ? undefined : (value as SessionTechniqueInput["outcome"]) }
                              : row,
                          ),
                        )
                      }
                      items={[
                        { value: "__none", label: "Résultat non noté" },
                        ...SESSION_TECHNIQUE_OUTCOMES.map((o) => ({ value: o, label: SESSION_TECHNIQUE_OUTCOME_LABELS[o] })),
                      ]}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Résultat non noté</SelectItem>
                        {SESSION_TECHNIQUE_OUTCOMES.map((o) => (
                          <SelectItem key={o} value={o}>
                            {SESSION_TECHNIQUE_OUTCOME_LABELS[o]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      aria-label="Partenaire"
                      placeholder="Partenaire (optionnel)"
                      value={t.partner_name ?? ""}
                      onChange={(e) =>
                        setTechniques((prev) =>
                          prev.map((row, idx) => (idx === i ? { ...row, partner_name: e.target.value } : row)),
                        )
                      }
                    />
                    <Input
                      aria-label="Niveau de pression (1-5)"
                      placeholder="Pression (1-5, optionnel)"
                      type="number"
                      min={1}
                      max={5}
                      value={t.pressure_level ?? ""}
                      onChange={(e) =>
                        setTechniques((prev) =>
                          prev.map((row, idx) =>
                            idx === i
                              ? { ...row, pressure_level: e.target.value ? Number(e.target.value) : undefined }
                              : row,
                          ),
                        )
                      }
                    />
                    <Input
                      aria-label="Problème rencontré"
                      placeholder="Problème rencontré (optionnel)"
                      value={t.problem ?? ""}
                      onChange={(e) =>
                        setTechniques((prev) =>
                          prev.map((row, idx) => (idx === i ? { ...row, problem: e.target.value } : row)),
                        )
                      }
                    />
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Supprimer la technique"
                onClick={() => setTechniques((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <TrashIcon />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Observations</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setObservations((prev) => [...prev, { type: "insight", content: "" }])}
          >
            <PlusIcon /> Ajouter
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {observations.map((o, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-start">
              <div className="flex flex-1 flex-col gap-2">
                <Select
                  value={o.type}
                  onValueChange={(value) =>
                    setObservations((prev) =>
                      prev.map((row, idx) => (idx === i ? { ...row, type: value as ObservationType } : row)),
                    )
                  }
                  items={OBSERVATION_TYPES.map((t) => ({ value: t, label: OBSERVATION_TYPE_LABELS[t] }))}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBSERVATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {OBSERVATION_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  aria-label="Contenu de l'observation"
                  placeholder="Décrivez..."
                  rows={2}
                  value={o.content}
                  onChange={(e) =>
                    setObservations((prev) =>
                      prev.map((row, idx) => (idx === i ? { ...row, content: e.target.value } : row)),
                    )
                  }
                />
                <Input
                  aria-label="Compétence liée (optionnel)"
                  placeholder="Compétence liée (optionnel)"
                  list="skills-datalist"
                  defaultValue={skills.find((s) => s.id === o.related_skill_id)?.name ?? ""}
                  onChange={(e) => {
                    const related_skill_id = resolveSkillId(e.target.value);
                    setObservations((prev) =>
                      prev.map((row, idx) => (idx === i ? { ...row, related_skill_id } : row)),
                    );
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Supprimer l'observation"
                disabled={observations.length <= 1}
                onClick={() => setObservations((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <TrashIcon />
              </Button>
            </div>
          ))}
          {missingRequiredObservation ? (
            <p className="text-destructive text-sm">
              Ajoutez au moins une observation de type Difficulté ou Question.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || missingRequiredObservation}>
          {isPending ? "Enregistrement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
