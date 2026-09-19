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
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";

export default async function CompetitionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const [matches, disciplines, athletes, sessionOptions] = await Promise.all([
    getMatches(),
    getDisciplines(),
    getAthletes(),
    getCompetitionSessionOptions(),
  ]);

  return (
    <AppShell>
      <div className="editorial-page editorial-competition">
        <PageHeader page="competition" title={dict["page.competition.title"]} description={dict["page.competition.description"]} />

        <ChampionshipPhotoMosaic page="competition" />

        <div className="editorial-competition-columns">
        <section className="editorial-section">
        <h2>{dict["competition.recordMatch"]}</h2>
        <MatchForm disciplines={disciplines} athletes={athletes} sessionOptions={sessionOptions} />
        </section>

        <section className="editorial-section">
        <h2>{dict["competition.matchHistory"]}</h2>
        {matches.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              {dict["competition.noMatches"]}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map((m) => (
              <MatchRow key={m.id} match={m} locale={locale} />
            ))}
          </div>
        )}
        </section>
        </div>
      </div>
    </AppShell>
  );
}
