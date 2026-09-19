"use client";

import { useActionState, useState } from "react";
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
import { MATCH_RESULTS } from "@/lib/domain/competition";
import { createMatch, type CompetitionActionState } from "@/lib/usecases/competition-actions";
import type { AthleteListItem, CompetitionSessionOption } from "@/lib/usecases/competition-actions";
import type { Discipline } from "@/lib/domain/training";
import { useI18n } from "@/components/i18n-provider";

export function MatchForm({
  disciplines,
  athletes,
  sessionOptions,
}: {
  disciplines: Discipline[];
  athletes: AthleteListItem[];
  sessionOptions: CompetitionSessionOption[];
}) {
  const { t } = useI18n();
  const initialState: CompetitionActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createMatch, initialState);
  const [resolvedAthleteId, setResolvedAthleteId] = useState("");
  const athleteByName = new Map(athletes.map((a) => [a.name.trim().toLowerCase(), a.id]));
  const notRated = t("competition.notRated", "Non noté");
  const none = t("competition.none", "Aucune");
  const competitionFallback = t("competition.fallback", "Compétition");

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match_event_name">{t("competition.eventNameLabel", "Événement (optionnel)")}</Label>
          <Input id="match_event_name" name="event_name" maxLength={160} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match_date">{t("form.date", "Date")}</Label>
          <Input id="match_date" name="date" type="date" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match_discipline">{t("form.discipline", "Discipline")}</Label>
          <Select
            name="discipline_id"
            items={disciplines.map((d) => ({ value: d.id, label: d.name }))}
          >
            <SelectTrigger id="match_discipline" className="w-full">
              <SelectValue placeholder={t("form.chooseDiscipline", "Choisir une discipline")} />
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match_athlete">{t("competition.opponentLabel", "Adversaire (optionnel)")}</Label>
          <Input
            id="match_athlete"
            name="athlete_name"
            list="match-athletes-datalist"
            placeholder={t("competition.opponentPlaceholder", "Nom de l'adversaire")}
            onChange={(e) => setResolvedAthleteId(athleteByName.get(e.target.value.trim().toLowerCase()) ?? "")}
          />
          <datalist id="match-athletes-datalist">
            {athletes.map((a) => (
              <option key={a.id} value={a.name} />
            ))}
          </datalist>
          <input type="hidden" name="athlete_id" value={resolvedAthleteId} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match_result">{t("competition.resultLabel", "Résultat (optionnel)")}</Label>
          <Select name="result" items={[{ value: "__none", label: notRated }, ...MATCH_RESULTS.map((r) => ({ value: r, label: t(`matchResult.${r}`, r) }))]}>
            <SelectTrigger id="match_result" className="w-full">
              <SelectValue placeholder={t("competition.resultLabel", "Résultat (optionnel)")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">{notRated}</SelectItem>
              {MATCH_RESULTS.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`matchResult.${r}`, r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match_method">{t("competition.methodLabel", "Méthode (optionnel)")}</Label>
          <Input id="match_method" name="method" maxLength={160} placeholder={t("competition.methodPlaceholder", "Soumission, décision, KO...")} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="match_session">{t("competition.linkedSessionLabel", "Séance liée (optionnel)")}</Label>
          <Select
            name="training_session_id"
            items={[
              { value: "__none", label: none },
              ...sessionOptions.map((s) => ({
                value: s.id,
                label: `${s.title ?? competitionFallback} — ${s.date}`,
              })),
            ]}
          >
            <SelectTrigger id="match_session" className="w-full">
              <SelectValue placeholder={t("competition.linkedSessionPlaceholder", "Séance de compétition loggée")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">{none}</SelectItem>
              {sessionOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title ?? competitionFallback} — {s.date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="match_notes">{t("competition.notesOptional", "Notes (optionnel)")}</Label>
          <Textarea id="match_notes" name="notes" rows={2} />
        </div>
      </div>
      {state.error ? <p role="alert" className="text-destructive text-sm">{state.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {t("competition.addMatch", "Ajouter la compétition")}
        </Button>
      </div>
    </form>
  );
}
