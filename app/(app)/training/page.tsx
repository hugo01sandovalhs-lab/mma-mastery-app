import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Camera, Dumbbell, PlusIcon, Timer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { SESSION_TYPE_LABEL_KEYS } from "@/lib/domain/training";
import { getTrainingSessions, type TrainingSessionListItem } from "@/lib/usecases/training-actions";
import { computeSessionStats } from "@/lib/domain/training";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { RoundTimer } from "@/components/training/round-timer";
import { WeeklySummaryCard } from "@/components/training/weekly-summary";
import { ChampionshipPhotoMosaic, ChampionshipSectionPhoto } from "@/components/championship/section-photo";

type Dict = (typeof DICTIONARIES)[Locale];

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export default async function TrainingListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const sessions = await getTrainingSessions();
  const stats = computeSessionStats(sessions);

  return (
    <AppShell>
      <div className="editorial-page editorial-training">
        <PageHeader page="training" title={dict["page.training.title"]} description={<>
            <p>{dict["page.training.tagline"]}</p>
            <p className="editorial-caption">
              {formatT(dict["trainingList.sessionCount"], { count: sessions.length })}
            </p>
          </>} actions={<>
            <Button variant="outline" size="lg" render={<Link href="/training/photos" />}>
              <Camera /> {dict["trainingList.gallery"]}
            </Button>
            <Button variant="outline" size="lg" render={<Link href="/training/review" />}>
              <BookOpen /> {dict["trainingList.toReview"]}
            </Button>
            <Button size="lg" render={<Link href="/training/new" />}>
              <PlusIcon /> {dict["action.newSession"]}
            </Button>
          </>} />

        <ChampionshipPhotoMosaic page="training" />

        <WeeklySummaryCard stats={stats} />

        <section id="timer" className="editorial-section scroll-mt-6">
          <h2>{dict["trainingList.timerTitle"]}</h2>
          <ChampionshipSectionPhoto src="/mma-mastery-photos/pexels-cao-vi-ton-449370203-17279410.jpg" alt="Deux boxeurs répètent leurs enchaînements sur le ring" label="Cadence de travail" labelKey="photoLabel.workPace" icon={Timer} objectPosition="50% 48%" />
          <RoundTimer />
        </section>

        <section id="sessions" className="editorial-section scroll-mt-6">
          <h2>{dict["trainingList.sessionsTitle"]}</h2>
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="editorial-empty">
              <Dumbbell className="size-6 text-muted-foreground" />
              <p className="font-medium">{dict["trainingList.noSessionsTitle"]}</p>
              <p className="max-w-md text-sm text-muted-foreground">
                {dict["trainingList.noSessionsDesc"]}
              </p>
              <Button variant="outline" size="sm" render={<Link href="/training/new" />} className="mt-1">
                {dict["action.newSession"]}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col">
            {sessions.map((s, i) => (
              <SessionRow key={s.id} session={s} isLast={i === sessions.length - 1} dict={dict} locale={locale} />
            ))}
          </ul>
        )}
        </section>
      </div>
    </AppShell>
  );
}

function SessionRow({
  session: s,
  isLast,
  dict,
  locale,
}: {
  session: TrainingSessionListItem;
  isLast: boolean;
  dict: Dict;
  locale: Locale;
}) {
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
                {s.title || dict[SESSION_TYPE_LABEL_KEYS[s.session_type]]}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(s.date, locale)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{s.discipline.name}</Badge>
              <Badge variant="outline">{dict[SESSION_TYPE_LABEL_KEYS[s.session_type]]}</Badge>
              {s.duration_minutes ? <Badge variant="outline">{s.duration_minutes} min</Badge> : null}
              {s.rpe ? <Badge variant="outline">RPE {s.rpe}</Badge> : null}
              {observationCount > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {formatT(dict["trainingList.observationCount"], { count: observationCount })}
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
