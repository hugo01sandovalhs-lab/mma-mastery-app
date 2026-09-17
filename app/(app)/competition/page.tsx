import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic } from "@/components/championship/section-photo";
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
      <div className="editorial-page editorial-competition">
        <PageHeader page="competition" title="Compétition" description="L'épreuve du combat. Retrouvez votre historique et les séquences vidéo liées à vos compétences." />

        <ChampionshipPhotoMosaic page="competition" />

        <div className="editorial-competition-columns">
        <section className="editorial-section">
        <h2>Enregistrer un combat</h2>
        <MatchForm disciplines={disciplines} athletes={athletes} sessionOptions={sessionOptions} />
        </section>

        <section className="editorial-section">
        <h2>Historique des combats</h2>
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
        </section>
        </div>
      </div>
    </AppShell>
  );
}
