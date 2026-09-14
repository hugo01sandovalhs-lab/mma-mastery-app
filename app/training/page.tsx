import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { SESSION_TYPE_LABELS } from "@/lib/domain/training";
import { getTrainingSessions } from "@/lib/usecases/training-actions";

export default async function TrainingListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessions = await getTrainingSessions();

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Entraînement</h1>
        <Button size="sm" render={<Link href="/training/new" />}>
          <PlusIcon /> Nouvelle séance
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground text-sm">
            Aucune séance enregistrée. Créez votre première séance.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => (
            <Link key={s.id} href={`/training/${s.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {s.title || SESSION_TYPE_LABELS[s.session_type]}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(s.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{s.discipline.name}</Badge>
                    <Badge variant="outline">{SESSION_TYPE_LABELS[s.session_type]}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
