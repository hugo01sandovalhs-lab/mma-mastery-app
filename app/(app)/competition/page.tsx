import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic } from "@/components/championship/section-photo";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { Skeleton } from "@/components/ui/skeleton";
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

/** The match-creation form's dropdown options are supplementary to the match history (this page's core content) — streamed independently. */
async function MatchFormSection() {
  const [disciplines, athletes, sessionOptions] = await Promise.all([
    getDisciplines().catch(() => []),
    getAthletes().catch(() => []),
    getCompetitionSessionOptions().catch(() => []),
  ]);
  return <MatchForm disciplines={disciplines} athletes={athletes} sessionOptions={sessionOptions} />;
}

export default async function CompetitionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const matches = await getMatches();

  return (
    <AppShell>
      <div className="editorial-page editorial-competition">
        <PageHeader page="competition" title={dict["page.competition.title"]} description={dict["page.competition.description"]} />

        <ChampionshipPhotoMosaic page="competition" />

        <div className="editorial-competition-columns">
        <section className="editorial-section">
        <h2>{dict["competition.recordMatch"]}</h2>
        <Suspense key={locale} fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
          <MatchFormSection />
        </Suspense>
        </section>

        <section className="editorial-photo-module">
        <ProgressiveImage
          src="/mma-mastery-photos/anastase-maragos-mDSGxpSugsE-unsplash.jpg"
          alt="Coin d'un combattant entre deux rounds, préparation dans le ring"
          fill
          sizes="(max-width: 900px) 100vw, 42vw"
          style={{ objectFit: "cover", objectPosition: "50% 55%" }}
        />
        <div className="flex items-center gap-2">
          <Timer className="size-4 shrink-0" aria-hidden="true" />
          <h2>{dict["competition.matchHistory"]}</h2>
        </div>
        <div className="goals-photo-panel competition-photo-panel flex flex-col gap-2">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict["competition.noMatches"]}</p>
          ) : (
            matches.map((m) => <MatchRow key={m.id} match={m} locale={locale} />)
          )}
        </div>
        </section>
        </div>
      </div>
    </AppShell>
  );
}
