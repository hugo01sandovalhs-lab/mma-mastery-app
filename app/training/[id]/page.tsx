import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DeleteSessionDialog } from "@/components/training/delete-session-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { OBSERVATION_TYPE_LABELS, SESSION_TYPE_LABELS } from "@/lib/domain/training";
import { getTrainingSession } from "@/lib/usecases/training-actions";

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
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{session.title || "Séance"}</h1>
          <p className="text-muted-foreground text-sm">
            {new Date(session.date).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/training/${session.id}/edit`} />}>
            <PencilIcon /> Modifier
          </Button>
          <DeleteSessionDialog sessionId={session.id} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{session.discipline.name}</Badge>
              <Badge variant="outline">{SESSION_TYPE_LABELS[session.session_type]}</Badge>
              {session.duration_minutes ? (
                <Badge variant="outline">{session.duration_minutes} min</Badge>
              ) : null}
              {session.rpe ? <Badge variant="outline">RPE {session.rpe}</Badge> : null}
            </div>
            {session.notes ? <p className="text-sm whitespace-pre-wrap">{session.notes}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Techniques travaillées</CardTitle>
          </CardHeader>
          <CardContent>
            {session.techniques.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune technique renseignée.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {session.techniques.map((t) => (
                  <li key={t.id} className="rounded-lg border border-border p-2 text-sm">
                    <span className="font-medium">{t.technique_name}</span>
                    {t.category ? (
                      <span className="text-muted-foreground"> — {t.category}</span>
                    ) : null}
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
            <ul className="flex flex-col gap-2">
              {session.observations.map((o) => (
                <li key={o.id} className="rounded-lg border border-border p-2 text-sm">
                  <Badge variant="outline" className="mb-1">
                    {OBSERVATION_TYPE_LABELS[o.type]}
                  </Badge>
                  <p className="whitespace-pre-wrap">{o.content}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
