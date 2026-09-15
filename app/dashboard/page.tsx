import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  Dumbbell,
  Flag,
  Flame,
  LibraryIcon,
  MessageCircleQuestion,
  SearchIcon,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { ACTION_TYPE_ICONS, ACTION_TYPE_LABELS } from "@/components/training/action-type-ui";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { ChampionshipHero } from "@/components/championship/hero";
import { ChampionshipMetricCard } from "@/components/championship/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { SESSION_TYPE_LABELS } from "@/lib/domain/training";
import {
  MASTERY_STAGES,
  MASTERY_STAGE_LABELS,
  type MasteryStage,
} from "@/lib/domain/skill";
import {
  TRAINING_PLAN_ACTION_COPY,
  type PriorityLevel,
  type SkillRecommendation,
  type TrainingPlanResult,
} from "@/lib/domain/training-intelligence";
import { getTrainingSessions, type TrainingSessionListItem } from "@/lib/usecases/training-actions";
import { getTrainingIntelligenceBundle } from "@/lib/usecases/training-intelligence-actions";
import { getSkillsProgressSummary, type SkillProgressSummary } from "@/lib/usecases/skill-actions";
import { getMemberClubSummary, type MemberClubSummary } from "@/lib/usecases/member-club-actions";

const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  high: "Priorité haute",
  medium: "Priorité moyenne",
};

function relativeDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  return `il y a ${days} jours`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const [sessions, { intelligence, plan }, progressSummary, clubSummary] = await Promise.all([
    getTrainingSessions(),
    getTrainingIntelligenceBundle(),
    getSkillsProgressSummary(),
    getMemberClubSummary(),
  ]);

  const recent = sessions.slice(0, 5);
  const highPriorityCount =
    intelligence.status === "ok"
      ? intelligence.recommendations.filter((r) => r.priority === "high").length
      : 0;

  const proficientCount =
    (progressSummary.stageCounts.consistent ?? 0) + (progressSummary.stageCounts.mastered ?? 0);
  const proficientPct =
    progressSummary.totalTracked > 0
      ? Math.round((proficientCount / progressSummary.totalTracked) * 100)
      : 0;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <Hero
          displayName={profile?.display_name ?? null}
          sessionCount={sessions.length}
          lastSessionDate={sessions[0]?.date ?? null}
          highPriorityCount={highPriorityCount}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ChampionshipMetricCard
            icon={Target}
            eyebrow="Focus principal"
            value={plan.status === "ok" ? plan.plan.focusSkillName : "Aucun focus"}
            subtitle={plan.status === "ok" ? ACTION_TYPE_LABELS[plan.plan.actionType] : undefined}
          />
          <ChampionshipMetricCard
            icon={CalendarClock}
            eyebrow="Priorités actives"
            value={
              highPriorityCount > 0
                ? `${highPriorityCount} compétence${highPriorityCount > 1 ? "s" : ""}`
                : "Aucune priorité"
            }
            subtitle={highPriorityCount > 0 ? "à travailler cette semaine" : undefined}
          />
          <ChampionshipMetricCard
            icon={TrendingUp}
            eyebrow="Progression globale"
            ring={proficientPct}
            insufficientData={progressSummary.totalTracked === 0}
          />
        </div>

        <ClubActivitySection summary={clubSummary} />

        <NextSessionPlan plan={plan} />

        <FocusSection intelligence={intelligence} plan={plan} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
          <RecentActivity sessions={recent} />
          <ProgressionSection summary={progressSummary} />
        </div>

        <QuickActions />
      </div>
    </DashboardShell>
  );
}

function Hero({
  displayName,
  sessionCount,
  lastSessionDate,
  highPriorityCount,
}: {
  displayName: string | null;
  sessionCount: number;
  lastSessionDate: string | null;
  highPriorityCount: number;
}) {
  const status =
    sessionCount === 0
      ? "Commencez votre suivi d'entraînement."
      : highPriorityCount > 0
        ? `${highPriorityCount} compétence${highPriorityCount > 1 ? "s" : ""} à prioriser cette semaine.`
        : lastSessionDate
          ? `Dernière séance ${relativeDays(lastSessionDate)}.`
          : "Continuez votre progression.";

  return (
    <ChampionshipHero eyebrow={displayName ? `Bonjour, ${displayName}` : "Bonjour"} headline={status}>
      <div className="flex flex-wrap items-center gap-4">
        {sessionCount > 0 ? (
          <p className="max-w-sm text-sm text-[oklch(0.85_0.01_80)]">
            {sessionCount} séance{sessionCount > 1 ? "s" : ""} enregistrée{sessionCount > 1 ? "s" : ""} au total
          </p>
        ) : null}
        <Button size="lg" render={<Link href="/training/new" />} className="w-fit">
          <Dumbbell /> Nouvelle séance
        </Button>
      </div>
    </ChampionshipHero>
  );
}

function ClubActivitySection({ summary }: { summary: MemberClubSummary | null }) {
  if (!summary) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <UsersRound className="size-4 text-primary" />
        <h2 className="font-heading text-lg font-extrabold tracking-tight">Mon club</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Prochains cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun cours planifié dans les 7 prochains jours.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {summary.upcomingClasses.map((c) => (
                  <li key={c.session_id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{c.class_name}</span>
                      <span className="truncate text-xs text-muted-foreground">{c.club_name}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(c.starts_at).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Présence &amp; groupes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Présence (30 derniers jours)</span>
              <Badge variant="outline">
                {summary.attendance.marked > 0 ? `${summary.attendance.rate}%` : "N/A"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.groupNames.length === 0 ? (
                <span className="text-sm text-muted-foreground">Aucun groupe.</span>
              ) : (
                summary.groupNames.map((name) => (
                  <Badge key={name} variant="secondary">
                    {name}
                  </Badge>
                ))
              )}
            </div>
            <Link href="/club" className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline">
              Voir mes clubs <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function NextSessionPlan({ plan }: { plan: TrainingPlanResult }) {
  if (plan.status !== "ok") return null;

  const { plan: p } = plan;
  const Icon = ACTION_TYPE_ICONS[p.actionType];
  const copy = TRAINING_PLAN_ACTION_COPY[p.actionType];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="font-heading text-lg font-extrabold tracking-tight">Pour ta prochaine séance</h2>
      </div>

      <Card className="rounded-2xl border-border bg-card">
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Focus principal
              </span>
              <Link
                href={`/skills/${p.focusSkillId}`}
                className="font-heading text-xl font-extrabold tracking-tight hover:underline"
              >
                {p.focusSkillName}
              </Link>
            </div>
            <Badge variant="default" className="flex items-center gap-1.5">
              <Icon className="size-3.5" />
              {ACTION_TYPE_LABELS[p.actionType]}
            </Badge>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Pourquoi</span>
            <ul className="flex flex-col gap-1">
              {p.reasons.map((reason, i) => (
                <li key={i} className="text-sm">
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-3">
            <PlanStep label="Drill recommandé" text={copy.drillHint} />
            <PlanStep label="Pendant le live" text={copy.liveWatchFor} />
            <PlanStep label="À observer après" text={copy.postObserve} />
          </div>

          {p.relatedSkills.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Prérequis liés: {p.relatedSkills.join(", ")}
            </p>
          ) : null}

          <Link
            href={`/skills/${p.focusSkillId}`}
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Voir le skill <ArrowRight className="size-3.5" />
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

function PlanStep({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function FocusSection({
  intelligence,
  plan,
}: {
  intelligence: Awaited<ReturnType<typeof getTrainingIntelligenceBundle>>["intelligence"];
  plan: TrainingPlanResult;
}) {
  const focusSkillId = plan.status === "ok" ? plan.plan.focusSkillId : null;
  const otherRecommendations =
    intelligence.status === "ok"
      ? intelligence.recommendations.filter((r) => r.skillId !== focusSkillId)
      : [];

  if (intelligence.status === "insufficient_data") {
    return (
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-primary" />
          <h2 className="font-heading text-lg font-extrabold tracking-tight">À travailler maintenant</h2>
        </div>
        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="flex flex-col items-start gap-2 py-8">
            <Target className="size-6 text-muted-foreground" />
            <p className="font-medium">Pas encore assez de données pour recommander un skill</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Enregistrez des séances avec les compétences travaillées, vos difficultés et vos
              questions. Dès qu&apos;un skill montre un signal clair (difficulté récente, sparring en
              retard, pratique arrêtée...), il apparaîtra ici avec une action concrète.
            </p>
            <Button variant="outline" size="sm" render={<Link href="/training/new" />} className="mt-1">
              Enregistrer une séance <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (otherRecommendations.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-primary" />
        <h2 className="font-heading text-lg font-extrabold tracking-tight">Autres priorités</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {otherRecommendations.map((rec) => (
          <FocusCard key={rec.skillId} rec={rec} />
        ))}
      </div>
    </section>
  );
}

function FocusCard({ rec }: { rec: SkillRecommendation }) {
  const isHigh = rec.priority === "high";
  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium leading-snug">{rec.skillName}</span>
          <Badge variant={isHigh ? "default" : "secondary"} className="shrink-0">
            {PRIORITY_LABELS[rec.priority]}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{rec.reasons[0]}</p>
        {rec.reasons.length > 1 ? (
          <p className="text-xs text-muted-foreground">+{rec.reasons.length - 1} autre(s) signal(aux)</p>
        ) : null}

        <p className="flex items-start gap-1.5 text-sm">
          <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{rec.action}</span>
        </p>

        <Link
          href={`/skills/${rec.skillId}`}
          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Voir le skill <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

function ProgressionSection({ summary }: { summary: SkillProgressSummary }) {
  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {summary.totalTracked === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune compétence suivie pour l&apos;instant. La progression apparaîtra dès que vous
            enregistrerez des séances avec des techniques.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {MASTERY_STAGES.filter((stage) => stage !== "unknown").map((stage) => (
                <StageBar
                  key={stage}
                  stage={stage}
                  count={summary.stageCounts[stage] ?? 0}
                  total={summary.totalTracked}
                />
              ))}
            </div>

            {summary.disciplines.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {summary.disciplines.map((d) => (
                  <Badge key={d.name} variant="outline">
                    {d.name} · {d.count}
                  </Badge>
                ))}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StageBar({ stage, count, total }: { stage: MasteryStage; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">{MASTERY_STAGE_LABELS[stage]}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-extrabold">{count}</span>
    </div>
  );
}

function RecentActivity({ sessions }: { sessions: TrainingSessionListItem[] }) {
  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune séance pour le moment.</p>
        ) : (
          <ul className="flex flex-col">
            {sessions.map((s, i) => {
              const techniqueNames = s.techniques.map((t) => t.technique_name);
              const observationCount = s.observations[0]?.count ?? 0;
              return (
                <li
                  key={s.id}
                  className={`flex gap-3 pb-5 ${
                    i < sessions.length - 1 ? "border-b border-border/60 mb-1" : ""
                  }`}
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold uppercase text-primary-foreground">
                    {s.discipline.name.slice(0, 2)}
                  </span>
                  <Link href={`/training/${s.id}`} className="flex-1 min-w-0 group/item">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium group-hover/item:underline">
                        {s.title || SESSION_TYPE_LABELS[s.session_type]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary">{s.discipline.name}</Badge>
                      <Badge variant="outline">{SESSION_TYPE_LABELS[s.session_type]}</Badge>
                      {observationCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageCircleQuestion className="size-3" />
                          {observationCount}
                        </span>
                      ) : null}
                    </div>
                    {techniqueNames.length > 0 ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {techniqueNames.join(" · ")}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { href: "/training/new", label: "Nouvelle séance", icon: Dumbbell },
    { href: "/skills", label: "Mes compétences", icon: Target },
    { href: "/training/review", label: "À revoir", icon: BookOpen },
    { href: "/training", label: "Historique complet", icon: Flame },
    { href: "/goals", label: "Objectifs", icon: Flag },
    { href: "/study", label: "File d'étude", icon: LibraryIcon },
    { href: "/search", label: "Recherche", icon: SearchIcon },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link key={a.href} href={a.href} className="group">
            <Card className="rounded-2xl border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-md">
              <CardContent className="flex items-center gap-3 py-4">
                <Icon className="size-4 text-primary" />
                <span className="text-sm font-medium">{a.label}</span>
                <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </section>
  );
}
