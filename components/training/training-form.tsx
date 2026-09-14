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
  SESSION_TYPE_LABELS,
  SESSION_TYPES,
  hasRequiredObservation,
  type Discipline,
  type ObservationType,
  type SessionTechniqueInput,
} from "@/lib/domain/training";
import type { TrainingActionState } from "@/lib/usecases/training-actions";
import type { TrainingSessionDetail } from "@/lib/usecases/training-actions";

type ObservationRow = { type: ObservationType; content: string };

type TrainingFormProps = {
  disciplines: Discipline[];
  action: (prevState: TrainingActionState, formData: FormData) => Promise<TrainingActionState>;
  initialData?: TrainingSessionDetail;
  submitLabel: string;
};

export function TrainingForm({ disciplines, action, initialData, submitLabel }: TrainingFormProps) {
  const initialState: TrainingActionState = { error: null };
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [techniques, setTechniques] = useState<SessionTechniqueInput[]>(
    initialData?.techniques.map((t) => ({
      technique_name: t.technique_name,
      category: t.category ?? undefined,
      notes: t.notes ?? undefined,
    })) ?? [],
  );
  const [observations, setObservations] = useState<ObservationRow[]>(
    initialData?.observations.map((o) => ({ type: o.type, content: o.content })) ?? [
      { type: "difficulty", content: "" },
    ],
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
              defaultValue={initialData?.session_type ?? "class"}
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
              setTechniques((prev) => [...prev, { technique_name: "", category: "", notes: "" }])
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
                  placeholder="Ex: Armbar depuis closed guard"
                  value={t.technique_name}
                  onChange={(e) =>
                    setTechniques((prev) =>
                      prev.map((row, idx) => (idx === i ? { ...row, technique_name: e.target.value } : row)),
                    )
                  }
                />
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
