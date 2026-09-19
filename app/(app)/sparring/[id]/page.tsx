import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, PencilIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DeleteSessionDialog } from "@/components/training/delete-session-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { OBSERVATION_TYPE_LABEL_KEYS, SESSION_TECHNIQUE_OUTCOME_LABEL_KEYS } from "@/lib/domain/training";
import { summarizeSparringRounds } from "@/lib/domain/sparring";
import { getSparringSession } from "@/lib/usecases/sparring-actions";
import { DICTIONARIES } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function SparringSessionDetailPage({
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

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const session = await getSparringSession(id);
  if (!session) notFound();

  const summary = summarizeSparringRounds(session.techniques);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link
          href="/sparring"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> {dict["page.sparring.title"]}
        </Link>

        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {session.title || dict["page.sparring.title"]}
            </h1>
            <p className="text-sm text-muted-foreground capitalize">{formatDate(session.date, locale)}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary">{session.discipline.name}</Badge>
              {session.duration_minutes ? <Badge variant="outline">{session.duration_minutes} min</Badge> : null}
              {session.rpe ? <Badge variant="outline">RPE {session.rpe}</Badge> : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" render={<Link href={`/training/${session.id}/edit`} />}>
              <PencilIcon /> {dict["trainingDetail.editButton"]}
            </Button>
            <DeleteSessionDialog sessionId={session.id} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{dict["sparringDetail.summaryTitle"]}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{summary.attempts}</Badge>
            <Badge variant="secondary">{summary.successes}</Badge>
            {summary.successRate !== null ? (
              <Badge variant="outline">
                {dict["sparringList.successRateLabel"]}: {Math.round(summary.successRate * 100)}%
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">{dict["sparringList.noAttempts"]}</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict["sparringDetail.roundsTitle"]}</CardTitle>
          </CardHeader>
          <CardContent>
            {session.techniques.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict["sparringDetail.noRounds"]}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {session.techniques.map((t) => (
                  <li key={t.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{t.technique_name}</span>
                      {t.skill_id ? (
                        <Link href={`/skills/${t.skill_id}`}>
                          <Badge variant="secondary">{t.skill?.name ?? dict["trainingDetail.skillFallback"]}</Badge>
                        </Link>
                      ) : null}
                      {t.outcome ? (
                        <Badge variant={t.outcome === "success" ? "default" : "outline"}>
                          {dict[SESSION_TECHNIQUE_OUTCOME_LABEL_KEYS[t.outcome]]}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {t.partner_name ? (
                        <span>
                          {dict["sparringDetail.partnerLabel"]}: {t.partner_name}
                        </span>
                      ) : null}
                      {t.pressure_level ? (
                        <span>
                          {dict["sparringDetail.intensityLabel"]}: {t.pressure_level}/5
                        </span>
                      ) : null}
                      {t.round_seconds ? (
                        <span>
                          {dict["sparringDetail.roundDurationLabel"]}: {t.round_seconds}s
                        </span>
                      ) : null}
                      {t.position ? (
                        <span>
                          {dict["sparringDetail.positionLabel"]}: {t.position}
                        </span>
                      ) : null}
                      {t.ruleset ? (
                        <span>
                          {dict["sparringDetail.rulesetLabel"]}: {t.ruleset}
                        </span>
                      ) : null}
                    </div>
                    {t.problem ? (
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {dict["sparringDetail.problemLabel"]}: {t.problem}
                      </p>
                    ) : null}
                    {t.notes ? <p className="mt-1 text-sm text-muted-foreground">{t.notes}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict["training.observationsTitle"]}</CardTitle>
          </CardHeader>
          <CardContent>
            {session.observations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict["trainingDetail.noObservations"]}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {session.observations.map((o) => (
                  <li key={o.id} className="rounded-lg border border-border p-3 text-sm">
                    <Badge variant="outline" className="mb-1.5">
                      {dict[OBSERVATION_TYPE_LABEL_KEYS[o.type]]}
                    </Badge>
                    <p className="whitespace-pre-wrap">{o.content}</p>
                    {o.related_skill_id ? (
                      <Link href={`/skills/${o.related_skill_id}`}>
                        <Badge variant="secondary" className="mt-1.5">
                          {o.skill?.name ?? dict["trainingDetail.skillFallback"]}
                        </Badge>
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {session.notes ? (
          <Card>
            <CardHeader>
              <CardTitle>{dict["form.notes"]}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
