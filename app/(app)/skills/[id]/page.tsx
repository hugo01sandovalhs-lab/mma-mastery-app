import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Dumbbell,
  MessageCircleQuestion,
  Sparkles,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import {
  MASTERY_STAGES,
  MASTERY_STAGE_LABEL_KEYS,
  SKILL_RELATION_TYPE_LABEL_KEYS,
  computeMasteryStage,
  metricLevel,
  type MasteryStage,
  type MetricLevel,
} from "@/lib/domain/skill";
import { OBSERVATION_TYPE_LABEL_KEYS } from "@/lib/domain/training";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import {
  MIN_DRILLING_REPS_FOR_TRANSFER_SIGNAL,
  MIN_SPARRING_ATTEMPTS_FOR_SUCCESS_SIGNAL,
  type SkillRecommendation,
} from "@/lib/domain/training-intelligence";
import { getSkill, type SkillDetail, type SkillHistoryItem, type SkillRelationItem } from "@/lib/usecases/skill-actions";
import { getGoals } from "@/lib/usecases/goals-actions";
import { getTrainingIntelligence } from "@/lib/usecases/training-intelligence-actions";
import {
  getResourcesForSkill,
  getSkillNotes,
  isBookmarked,
  isInStudyQueue,
  type ResourceListItem,
  type SkillNote,
} from "@/lib/usecases/knowledge-actions";
import { SkillActionsBar } from "@/components/skills/skill-actions-bar";
import { SkillNotesSection } from "@/components/skills/skill-notes-section";
import { ResourceRow } from "@/components/study/resource-row";
import { ResourceForm } from "@/components/study/resource-form";

const STAGE_DESC_KEYS: Record<MasteryStage, `skillDetail.stageDesc.${MasteryStage}`> = {
  unknown: "skillDetail.stageDesc.unknown",
  introduced: "skillDetail.stageDesc.introduced",
  drilling: "skillDetail.stageDesc.drilling",
  applying: "skillDetail.stageDesc.applying",
  consistent: "skillDetail.stageDesc.consistent",
  mastered: "skillDetail.stageDesc.mastered",
};

const STAGE_BADGE_VARIANT: Record<MasteryStage, "default" | "secondary" | "outline"> = {
  unknown: "outline",
  introduced: "secondary",
  drilling: "secondary",
  applying: "secondary",
  consistent: "default",
  mastered: "default",
};

const LEVEL_LABEL_KEYS: Record<MetricLevel, `metricLevel.${MetricLevel}`> = {
  none: "metricLevel.none",
  low: "metricLevel.low",
  available: "metricLevel.available",
};

type Dict = (typeof DICTIONARIES)[Locale];

function relativeDays(iso: string, dict: Dict): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return dict["common.today"];
  if (days === 1) return dict["common.yesterday"];
  return formatT(dict["common.daysAgo"], { days });
}

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const skill = await getSkill(id);
  if (!skill) notFound();

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const [intelligence, notes, resources, bookmarked, queued, goals] = await Promise.all([
    getTrainingIntelligence(),
    getSkillNotes(id),
    getResourcesForSkill(id),
    isBookmarked("skill", id),
    isInStudyQueue(id),
    getGoals(),
  ]);
  const goaled = goals.some((g) => g.skill?.id === id && g.status === "active");
  const recommendation =
    intelligence.status === "ok" ? intelligence.recommendations.find((r) => r.skillId === id) : undefined;

  const stage = computeMasteryStage(skill.progress);
  const stageIndex = MASTERY_STAGES.indexOf(stage);
  const maxIndex = MASTERY_STAGES.length - 1;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link
          href="/skills"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> {dict["nav.skills"]}
        </Link>

        <Hero skill={skill} stage={stage} stageIndex={stageIndex} maxIndex={maxIndex} dict={dict} />

        <div className="-mt-4">
          <SkillActionsBar
            skillId={skill.id}
            skillName={skill.name}
            initiallyBookmarked={bookmarked}
            alreadyQueued={queued}
            alreadyGoaled={goaled}
          />
        </div>

        <WhatIKnowSection skill={skill} stage={stage} dict={dict} />

        <ProgressionSection skill={skill} dict={dict} />

        <RelationsSection skill={skill} dict={dict} />

        <NextActionSection recommendation={recommendation} stage={stage} dict={dict} />

        <NotesAndResourcesSection skillId={skill.id} notes={notes} resources={resources} dict={dict} />

        <HistorySection history={skill.history} dict={dict} locale={locale} />
      </div>
    </AppShell>
  );
}

function Hero({
  skill,
  stage,
  stageIndex,
  maxIndex,
  dict,
}: {
  skill: SkillDetail;
  stage: MasteryStage;
  stageIndex: number;
  maxIndex: number;
  dict: Dict;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{skill.discipline.name}</Badge>
          {skill.category ? <Badge variant="outline">{skill.category}</Badge> : null}
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{skill.name}</h1>
        {skill.description ? (
          <p className="max-w-2xl text-sm whitespace-pre-wrap text-muted-foreground">{skill.description}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Badge variant={STAGE_BADGE_VARIANT[stage]}>{dict[MASTERY_STAGE_LABEL_KEYS[stage]]}</Badge>
          <div
            className="flex items-center gap-1"
            aria-label={formatT(dict["skillDetail.stepAria"], { current: Math.max(stageIndex, 0), max: maxIndex })}
          >
            {Array.from({ length: maxIndex }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-5 rounded-full ${i < stageIndex ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          {skill.stats.lastPracticedAt ? (
            <span className="text-xs text-muted-foreground">
              {formatT(dict["skills.practicedAgo"], { when: relativeDays(skill.stats.lastPracticedAt, dict) })}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{dict["skillDetail.neverPracticed"]}</span>
          )}
        </div>
      </div>
      <Button size="lg" render={<Link href="/training/new" />} className="w-fit shrink-0">
        <Dumbbell /> {dict["action.newSession"]}
      </Button>
    </div>
  );
}

function WhatIKnowSection({ skill, stage, dict }: { skill: SkillDetail; stage: MasteryStage; dict: Dict }) {
  const facts: string[] = [];
  const p = skill.progress;

  if (p.knowledge_level > 0) facts.push(formatT(dict["skillDetail.factKnowledge"], { level: p.knowledge_level }));
  if (p.drilling_reps > 0) facts.push(formatT(dict["skillDetail.factDrilling"], { count: p.drilling_reps }));
  if (p.live_application_count > 0)
    facts.push(formatT(dict["skillDetail.factLiveApp"], { count: p.live_application_count }));
  if (p.sparring_attempt_count > 0)
    facts.push(formatT(dict["skillDetail.factSparring"], { success: p.sparring_success_count, attempts: p.sparring_attempt_count }));
  if (p.evidence_count > 0)
    facts.push(formatT(dict["skillDetail.factObservations"], { count: p.evidence_count }));
  if (skill.stats.sessionCount > 0)
    facts.push(formatT(dict["skillDetail.factSessions"], { count: skill.stats.sessionCount }));

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-primary" />
        <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["skillDetail.whatIKnowTitle"]}</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-3 py-5">
          <p className="text-sm">{dict[STAGE_DESC_KEYS[stage]]}</p>
          {facts.length > 0 ? (
            <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
              {facts.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="size-1 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-border pt-3 text-sm text-muted-foreground">
              {dict["skillDetail.noObservations"]}
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function MetricRow({
  label,
  level,
  detail,
  dict,
}: {
  label: string;
  level: MetricLevel;
  detail: string | null;
  dict: Dict;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {detail ? <span className="text-sm text-muted-foreground">{detail}</span> : null}
        <Badge variant={level === "available" ? "default" : level === "low" ? "secondary" : "outline"}>
          {dict[LEVEL_LABEL_KEYS[level]]}
        </Badge>
      </div>
    </div>
  );
}

function ProgressionSection({ skill, dict }: { skill: SkillDetail; dict: Dict }) {
  const p = skill.progress;
  const sparringRatio =
    p.sparring_attempt_count > 0 ? `${p.sparring_success_count}/${p.sparring_attempt_count}` : null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["skillDetail.progressionTitle"]}</h2>
      <Card>
        <CardContent className="divide-y divide-border py-1">
          <MetricRow
            label={dict["skillDetail.metric.drilling"]}
            level={metricLevel(p.drilling_reps, MIN_DRILLING_REPS_FOR_TRANSFER_SIGNAL)}
            detail={p.drilling_reps > 0 ? `${p.drilling_reps} reps` : null}
            dict={dict}
          />
          <MetricRow
            label={dict["skillDetail.metric.liveApplication"]}
            level={metricLevel(p.live_application_count, 3)}
            detail={p.live_application_count > 0 ? `${p.live_application_count}` : null}
            dict={dict}
          />
          <MetricRow
            label={dict["skillDetail.metric.sparring"]}
            level={metricLevel(p.sparring_attempt_count, MIN_SPARRING_ATTEMPTS_FOR_SUCCESS_SIGNAL)}
            detail={sparringRatio}
            dict={dict}
          />
          <MetricRow
            label={dict["skillDetail.metric.consistency"]}
            level={p.consistency_score === null ? "none" : "available"}
            detail={p.consistency_score === null ? null : `${Math.round(p.consistency_score * 100)}%`}
            dict={dict}
          />
          <MetricRow
            label={dict["skillDetail.metric.pressure"]}
            level={p.pressure_performance_level === null ? "none" : "available"}
            detail={p.pressure_performance_level === null ? null : `${p.pressure_performance_level}/5`}
            dict={dict}
          />
          <MetricRow
            label={dict["skillDetail.metric.confidence"]}
            level={p.confidence_level === null ? "none" : "available"}
            detail={p.confidence_level === null ? null : `${p.confidence_level}/5`}
            dict={dict}
          />
          <MetricRow
            label={dict["skillDetail.metric.evidence"]}
            level={metricLevel(p.evidence_count, 3)}
            detail={p.evidence_count > 0 ? `${p.evidence_count}` : null}
            dict={dict}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function RelationsSection({ skill, dict }: { skill: SkillDetail; dict: Dict }) {
  const related = [...skill.relationsFrom, ...skill.relationsTo].filter(
    (r) => r.relation_type === "related",
  );
  const groups: { title: string; relations: SkillRelationItem[] }[] = [
    { title: dict["skillDetail.relation.prerequisites"], relations: skill.relationsFrom.filter((r) => r.relation_type === "prerequisite") },
    { title: dict["skillDetail.relation.counters"], relations: skill.relationsFrom.filter((r) => r.relation_type === "counter") },
    { title: dict["skillDetail.relation.variations"], relations: skill.relationsFrom.filter((r) => r.relation_type === "variation") },
    { title: dict["skillDetail.relation.followUps"], relations: skill.relationsFrom.filter((r) => r.relation_type === "follow_up") },
    { title: dict["skillDetail.relation.transitions"], relations: skill.relationsFrom.filter((r) => r.relation_type === "transition") },
    { title: dict["skillDetail.relation.related"], relations: related },
    {
      title: dict["skillDetail.relation.dependents"],
      relations: skill.relationsTo.filter((r) => r.relation_type === "prerequisite"),
    },
  ].filter((g) => g.relations.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["skillDetail.relationsTitle"]}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title} className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase">{g.title}</h3>
            <div className="flex flex-col gap-2">
              {g.relations.map((r) => (
                <Link key={r.id} href={`/skills/${r.skill.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center justify-between gap-2 py-2">
                      <span className="text-sm">{r.skill.name}</span>
                      <Badge variant="outline">{dict[SKILL_RELATION_TYPE_LABEL_KEYS[r.relation_type]]}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NextActionSection({
  recommendation,
  stage,
  dict,
}: {
  recommendation: SkillRecommendation | undefined;
  stage: MasteryStage;
  dict: Dict;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["skillDetail.nextActionTitle"]}</h2>
      </div>
      {recommendation ? (
        <Card className="relative overflow-hidden">
          <span
            className={`absolute inset-y-0 left-0 w-1 ${
              recommendation.priority === "high" ? "bg-primary" : "bg-muted-foreground/40"
            }`}
          />
          <CardContent className="flex flex-col gap-2.5 py-5 pl-5">
            <div className="flex items-start justify-between gap-2">
              <Badge variant={recommendation.priority === "high" ? "default" : "secondary"}>
                {recommendation.priority === "high" ? dict["skillDetail.priorityHigh"] : dict["skillDetail.priorityMedium"]}
              </Badge>
            </div>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {recommendation.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="flex items-start gap-1.5 text-sm">
              <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{recommendation.action}</span>
            </p>
            <Button size="sm" render={<Link href="/training/new" />} className="mt-1 w-fit">
              {dict["skillDetail.logSession"]} <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-start gap-2 py-6">
            <p className="text-sm text-muted-foreground">
              {stage === "unknown" ? dict["skillDetail.noDataUnknown"] : dict["skillDetail.noDataGeneric"]}
            </p>
            <Button variant="outline" size="sm" render={<Link href="/training/new" />}>
              {dict["skillDetail.logSession"]} <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function NotesAndResourcesSection({
  skillId,
  notes,
  resources,
  dict,
}: {
  skillId: string;
  notes: SkillNote[];
  resources: ResourceListItem[];
  dict: Dict;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["skillDetail.notesResourcesTitle"]}</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase">{dict["skillDetail.personalNotes"]}</h3>
          <SkillNotesSection skillId={skillId} notes={notes} />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase">{dict["skillDetail.externalResources"]}</h3>
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict["skillDetail.noResource"]}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {resources.map((r) => (
                <ResourceRow key={r.id} resource={r} />
              ))}
            </div>
          )}
          <ResourceForm skills={[]} fixedSkillId={skillId} />
        </div>
      </div>
    </section>
  );
}

function HistorySection({ history, dict, locale }: { history: SkillHistoryItem[]; dict: Dict; locale: Locale }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["skillDetail.historyTitle"]}</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {dict["skillDetail.relatedSessions"]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {dict["skillDetail.noHistory"]}
            </p>
          ) : (
            <ul className="flex flex-col">
              {history.map((item, i) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className={`relative flex gap-3 pb-5 pl-4 ${
                    i < history.length - 1 ? "border-l border-border" : "border-l border-transparent"
                  }`}
                >
                  <span className="absolute top-1 -left-[4.5px] size-2 rounded-full bg-primary" />
                  <Link href={`/training/${item.sessionId}`} className="group/item min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium group-hover/item:underline">
                        {item.sessionTitle || (item.kind === "technique" ? item.techniqueName : dict["skillDetail.observationFallback"])}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {item.kind === "technique" ? (
                        <Badge variant="secondary">{dict["skillDetail.techniqueBadge"]}</Badge>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageCircleQuestion className="size-3" />
                          {dict[OBSERVATION_TYPE_LABEL_KEYS[item.observationType]]}
                        </span>
                      )}
                    </div>
                    {item.kind === "technique" && item.notes ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{item.notes}</p>
                    ) : null}
                    {item.kind === "observation" ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{item.content}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
