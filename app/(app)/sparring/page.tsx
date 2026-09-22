import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon, Swords } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { createClient } from "@/lib/infra/db/supabase-server";
import {
  computeRecentTrend,
  summarizePositionBreakdown,
  summarizeSparringRounds,
  summarizeTechniqueBreakdown,
} from "@/lib/domain/sparring";
import { getSparringSessions, type SparringSessionListItem } from "@/lib/usecases/sparring-actions";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

type Dict = (typeof DICTIONARIES)[Locale];

function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export default async function SparringListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const sessions = await getSparringSessions();
  const allRounds = sessions.flatMap((s) => s.techniques);
  const summary = summarizeSparringRounds(allRounds);
  const positionBreakdown = summarizePositionBreakdown(allRounds);
  const techniqueBreakdown = summarizeTechniqueBreakdown(allRounds);
  const trend = computeRecentTrend(sessions.map((s) => ({ date: s.date, rounds: s.techniques })));

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {dict["page.sparring.title"]}
            </h1>
            <p className="text-sm text-muted-foreground">{dict["page.sparring.tagline"]}</p>
            <p className="text-xs text-muted-foreground">
              {formatT(dict["sparringList.sessionCount"], { count: sessions.length })}
            </p>
          </div>
          <Button size="lg" render={<Link href="/training/new?type=sparring" />}>
            <PlusIcon /> {dict["action.newSparring"]}
          </Button>
        </div>

        <SummaryCard summary={summary} dict={dict} />

        {sessions.length > 0 ? (
          <InsightsCard positionBreakdown={positionBreakdown} techniqueBreakdown={techniqueBreakdown} trend={trend} dict={dict} />
        ) : null}

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Swords className="size-6 text-muted-foreground" />
              <p className="font-medium">{dict["sparringList.noSessionsTitle"]}</p>
              <p className="max-w-md text-sm text-muted-foreground">{dict["sparringList.noSessionsDesc"]}</p>
              <Button variant="outline" size="sm" render={<Link href="/training/new?type=sparring" />} className="mt-1">
                {dict["action.newSparring"]}
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
      </div>
    </AppShell>
  );
}

function SummaryCard({
  summary,
  dict,
}: {
  summary: ReturnType<typeof summarizeSparringRounds>;
  dict: Dict;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict["sparringList.summaryTitle"]}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatT(dict["sparringList.attempts"], { count: summary.attempts })}</Badge>
          <Badge variant="secondary">{formatT(dict["sparringList.successes"], { count: summary.successes })}</Badge>
          {summary.successRate !== null ? (
            <Badge variant="outline">
              {dict["sparringList.successRateLabel"]}: {Math.round(summary.successRate * 100)}%
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">{dict["sparringList.noAttempts"]}</span>
          )}
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium">{dict["sparringList.recurringDifficultiesTitle"]}</p>
          {summary.recurringDifficulties.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict["sparringList.noRecurringDifficulties"]}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {summary.recurringDifficulties.map((d) => (
                <li key={d.problem} className="flex items-center gap-2 text-sm">
                  <span>{d.problem}</span>
                  <Badge variant="outline">{formatT(dict["sparringList.occurrences"], { count: d.count })}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightsCard({
  positionBreakdown,
  techniqueBreakdown,
  trend,
  dict,
}: {
  positionBreakdown: ReturnType<typeof summarizePositionBreakdown>;
  techniqueBreakdown: ReturnType<typeof summarizeTechniqueBreakdown>;
  trend: ReturnType<typeof computeRecentTrend>;
  dict: Dict;
}) {
  const { weakPositions, strongPositions } = positionBreakdown;
  const { mostAttempted, leastSuccessful } = techniqueBreakdown;
  const TrendIcon = trend === null ? null : trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict["sparringList.insightsTitle"]}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {trend !== null && TrendIcon !== null ? (
          <div className="flex items-center gap-2 text-sm">
            <TrendIcon className={`size-4 shrink-0 ${trend.direction === "up" ? "text-primary" : trend.direction === "down" ? "text-destructive" : "text-muted-foreground"}`} />
            <span className="font-medium">{dict["sparringList.trendLabel"]}:</span>
            <span>
              {formatT(dict[trend.direction === "up" ? "sparringList.trendUp" : trend.direction === "down" ? "sparringList.trendDown" : "sparringList.trendStable"], {
                recent: Math.round(trend.recentRate * 100),
                prior: Math.round(trend.priorRate * 100),
              })}
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-medium">{dict["sparringList.weakPositionsTitle"]}</p>
            {weakPositions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict["sparringList.noPositionData"]}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {weakPositions.map((p) => (
                  <li key={p.position} className="flex items-center gap-2 text-sm">
                    <span>{p.position}</span>
                    <Badge variant="outline">{Math.round(p.successRate * 100)}% / {p.attempts}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">{dict["sparringList.strongPositionsTitle"]}</p>
            {strongPositions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict["sparringList.noPositionData"]}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {strongPositions.map((p) => (
                  <li key={p.position} className="flex items-center gap-2 text-sm">
                    <span>{p.position}</span>
                    <Badge variant="outline">{Math.round(p.successRate * 100)}% / {p.attempts}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">{dict["sparringList.mostAttemptedTitle"]}</p>
            {mostAttempted.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict["sparringList.noTechniqueData"]}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {mostAttempted.map((t) => (
                  <li key={t.technique} className="flex items-center gap-2 text-sm">
                    <span>{t.technique}</span>
                    <Badge variant="outline">{formatT(dict["sparringList.occurrences"], { count: t.attempts })}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">{dict["sparringList.leastSuccessfulTitle"]}</p>
            {leastSuccessful.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict["sparringList.noTechniqueData"]}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {leastSuccessful.map((t) => (
                  <li key={t.technique} className="flex items-center gap-2 text-sm">
                    <span>{t.technique}</span>
                    <Badge variant="outline">{Math.round((t.successRate as number) * 100)}% / {t.attempts}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionRow({
  session: s,
  isLast,
  dict,
  locale,
}: {
  session: SparringSessionListItem;
  isLast: boolean;
  dict: Dict;
  locale: Locale;
}) {
  const roundSummary = summarizeSparringRounds(s.techniques);
  const techniqueNames = s.techniques.map((t) => t.technique_name);

  return (
    <li
      className={`relative flex gap-3 pb-6 pl-4 ${
        isLast ? "border-l border-transparent" : "border-l border-border"
      }`}
    >
      <span className="absolute top-1 -left-[4.5px] size-2 rounded-full bg-primary" />
      <Link href={`/sparring/${s.id}`} className="group/item min-w-0 flex-1">
        <Card className="transition-colors group-hover/item:bg-muted/50">
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium group-hover/item:underline">{s.title || dict["page.sparring.title"]}</span>
              <span className="text-xs text-muted-foreground">{formatDate(s.date, locale)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{s.discipline.name}</Badge>
              {s.duration_minutes ? <Badge variant="outline">{s.duration_minutes} min</Badge> : null}
              {roundSummary.successRate !== null ? (
                <Badge variant="outline">{Math.round(roundSummary.successRate * 100)}%</Badge>
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
