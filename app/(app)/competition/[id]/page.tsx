import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { MATCH_RESULT_LABELS } from "@/lib/domain/competition";
import { getMatch, getSequencesForMatch } from "@/lib/usecases/competition-actions";
import { getSkills } from "@/lib/usecases/skill-actions";
import { SequenceForm } from "@/components/competition/sequence-form";
import { SequenceRow } from "@/components/competition/sequence-row";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const match = await getMatch(id);
  if (!match) notFound();

  const [sequences, skills] = await Promise.all([getSequencesForMatch(id), getSkills()]);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link
          href="/competition"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Compétition
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {match.athlete ? `vs ${match.athlete.name}` : match.event_name || "Compétition"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(match.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {match.discipline ? <Badge variant="outline">{match.discipline.name}</Badge> : null}
            {match.event_name && match.athlete ? <Badge variant="outline">{match.event_name}</Badge> : null}
            {match.result ? <Badge variant="secondary">{MATCH_RESULT_LABELS[match.result]}</Badge> : null}
            {match.method ? <Badge variant="outline">{match.method}</Badge> : null}
            {match.training_session_id ? (
              <Link href={`/training/${match.training_session_id}`}>
                <Badge variant="secondary">Séance liée</Badge>
              </Link>
            ) : null}
          </div>
        </div>

        {match.notes ? (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{match.notes}</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Séquences vidéo</h2>
          <SequenceForm matchId={match.id} skills={skills} />
          {sequences.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">
                Aucune séquence pour l&apos;instant.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {sequences.map((s) => (
                <SequenceRow key={s.id} sequence={s} matchId={match.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
