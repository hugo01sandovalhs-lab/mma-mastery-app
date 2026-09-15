import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getDisciplines } from "@/lib/usecases/training-actions";
import {
  getAthletes,
  getCompetitionSessionOptions,
  getMatches,
} from "@/lib/usecases/competition-actions";
import { MatchForm } from "@/components/competition/match-form";
import { MatchRow } from "@/components/competition/match-row";

export default async function CompetitionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [matches, disciplines, athletes, sessionOptions] = await Promise.all([
    getMatches(),
    getDisciplines(),
    getAthletes(),
    getCompetitionSessionOptions(),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-primary" />
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Compétition</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Historique de combats et séquences vidéo liées à vos compétences.
          </p>
        </div>

        <MatchForm disciplines={disciplines} athletes={athletes} sessionOptions={sessionOptions} />

        {matches.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Aucune compétition pour l&apos;instant.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
