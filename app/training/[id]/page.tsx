import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, PencilIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DeleteSessionDialog } from "@/components/training/delete-session-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { OBSERVATION_TYPE_LABELS, SESSION_TYPE_LABELS } from "@/lib/domain/training";
import { getTrainingSession } from "@/lib/usecases/training-actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function TrainingSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const session = await getTrainingSession(id);
  if (!session) notFound();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link
          href="/training"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Entraînement
        </Link>

        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {session.title || SESSION_TYPE_LABELS[session.session_type]}
            </h1>
            <p className="text-sm text-muted-foreground capitalize">{formatDate(session.date)}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary">{session.discipline.name}</Badge>
              <Badge variant="outline">{SESSION_TYPE_LABELS[session.session_type]}</Badge>
              {session.duration_minutes ? (
                <Badge variant="outline">{session.duration_minutes} min</Badge>
              ) : null}
              {session.rpe ? <Badge variant="outline">RPE {session.rpe}</Badge> : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" render={<Link href={`/training/${session.id}/edit`} />}>
              <PencilIcon /> Modifier
            </Button>
            <DeleteSessionDialog sessionId={session.id} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Compétences travaillées</CardTitle>
            </CardHeader>
            <CardContent>
              {session.techniques.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune technique renseignée.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {session.techniques.map((t) => (
                    <li key={t.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{t.technique_name}</span>
                        {t.skill_id ? (
                          <Link href={`/skills/${t.skill_id}`}>
                            <Badge variant="secondary">{t.skill?.name ?? "Compétence"}</Badge>
                          </Link>
                        ) : null}
                      </div>
                      {t.category ? (
                        <p className="mt-1 text-xs text-muted-foreground">{t.category}</p>
                      ) : null}
                      {t.notes ? <p className="mt-1 text-sm text-muted-foreground">{t.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observations</CardTitle>
            </CardHeader>
            <CardContent>
              {session.observations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune observation renseignée.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {session.observations.map((o) => (
                    <li key={o.id} className="rounded-lg border border-border p-3 text-sm">
                      <Badge variant="outline" className="mb-1.5">
                        {OBSERVATION_TYPE_LABELS[o.type]}
                      </Badge>
                      <p className="whitespace-pre-wrap">{o.content}</p>
                      {o.related_skill_id ? (
                        <Link href={`/skills/${o.related_skill_id}`}>
                          <Badge variant="secondary" className="mt-1.5">
                            {o.skill?.name ?? "Compétence"}
                          </Badge>
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {session.notes ? (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
