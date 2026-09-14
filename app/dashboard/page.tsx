import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { SESSION_TYPE_LABELS } from "@/lib/domain/training";
import { getTrainingSessions } from "@/lib/usecases/training-actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessions = await getTrainingSessions();
  const recent = sessions.slice(0, 5);

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold">Tableau de bord</h1>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Séances enregistrées</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{sessions.length}</CardContent>
        </Card>
        <Card className="flex flex-1 items-center justify-center">
          <CardContent className="flex w-full items-center justify-center pt-6">
            <Button render={<Link href="/training/new" />}>
              <PlusIcon /> Nouvelle séance
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Séances récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune séance pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recent.map((s) => (
                <li key={s.id}>
                  <Link href={`/training/${s.id}`} className="text-sm underline underline-offset-2">
                    {new Date(s.date).toLocaleDateString("fr-FR")} — {s.title || SESSION_TYPE_LABELS[s.session_type]}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
