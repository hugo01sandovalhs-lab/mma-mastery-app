import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell, PlusIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { SESSION_TYPE_LABELS } from "@/lib/domain/training";
import { getTrainingSessions, type TrainingSessionListItem } from "@/lib/usecases/training-actions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function TrainingListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessions = await getTrainingSessions();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Entraînement
            </h1>
            <p className="text-sm text-muted-foreground">
              {sessions.length} séance{sessions.length > 1 ? "s" : ""} enregistrée
              {sessions.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button size="lg" render={<Link href="/training/new" />} className="w-fit">
            <PlusIcon /> Nouvelle séance
          </Button>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-2 py-8">
              <Dumbbell className="size-6 text-muted-foreground" />
              <p className="font-medium">Aucune séance enregistrée</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Enregistrez votre première séance pour commencer à suivre vos compétences et
                déclencher Training Intelligence.
              </p>
              <Button variant="outline" size="sm" render={<Link href="/training/new" />} className="mt-1">
                Nouvelle séance
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col">
            {sessions.map((s, i) => (
              <SessionRow key={s.id} session={s} isLast={i === sessions.length - 1} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function SessionRow({ session: s, isLast }: { session: TrainingSessionListItem; isLast: boolean }) {
  const techniqueNames = s.techniques.map((t) => t.technique_name);
  const observationCount = s.observations[0]?.count ?? 0;

  return (
    <li
      className={`relative flex gap-3 pb-6 pl-4 ${
        isLast ? "border-l border-transparent" : "border-l border-border"
      }`}
    >
      <span className="absolute top-1 -left-[4.5px] size-2 rounded-full bg-primary" />
      <Link href={`/training/${s.id}`} className="group/item min-w-0 flex-1">
        <Card className="transition-colors group-hover/item:bg-muted/50">
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium group-hover/item:underline">
                {s.title || SESSION_TYPE_LABELS[s.session_type]}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(s.date)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{s.discipline.name}</Badge>
              <Badge variant="outline">{SESSION_TYPE_LABELS[s.session_type]}</Badge>
              {s.duration_minutes ? <Badge variant="outline">{s.duration_minutes} min</Badge> : null}
              {s.rpe ? <Badge variant="outline">RPE {s.rpe}</Badge> : null}
              {observationCount > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {observationCount} observation{observationCount > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
            {techniqueNames.length > 0 ? (
              <p className="truncate text-xs text-muted-foreground">{techniqueNames.join(" · ")}</p>
            ) : null}
          </CardContent>
        </Card>
      </Link>
    </li>
  );
}
