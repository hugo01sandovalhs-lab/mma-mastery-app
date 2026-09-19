import Link from "next/link";
import Image from "next/image";
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
  type LucideIcon,
  MessageCircleQuestion,
  SearchIcon,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { ACTION_TYPE_LABELS } from "@/components/training/action-type-ui";
import { ProgressRing } from "@/components/championship/progress-ring";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { PAGE_PHOTOS } from "@/lib/design/photography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { SESSION_TYPE_LABELS } from "@/lib/domain/training";
import { MASTERY_STAGES, MASTERY_STAGE_LABELS } from "@/lib/domain/skill";
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

const PHOTOS = {
  focus: { src: "/mma-mastery-photos/pexels-cottonbro-4761341.jpg", position: "56% 48%" },
  session: { src: "/mma-mastery-photos/pexels-duren-williams-29414623-14796246.jpg", position: "58% 58%" },
  progress: { src: "/mma-mastery-photos/pexels-gera-cejas-3616330-38758867.jpg", position: "50% 62%" },
  activity: { src: "/mma-mastery-photos/pexels-eduard-perez-2158828645-38674544.jpg", position: "50% 58%" },
  club: "/mma-mastery-photos/pexels-gera-cejas-3616330-38758994.jpg",
  globalProgress: { src: "/mma-mastery-photos/redd-francisco-tJVCPGzuEoA-unsplash.jpg", position: "50% 30%" },
} as const;

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
    <main className="championship-dashboard">
        <Hero
          displayName={profile?.display_name ?? null}
          sessionCount={sessions.length}
          lastSessionDate={sessions[0]?.date ?? null}
          highPriorityCount={highPriorityCount}
          imageSrc={PAGE_PHOTOS.dashboard.src}
        />

        <div className="championship-grid">
        <StatRow plan={plan} proficientPct={proficientPct} progressSummary={progressSummary} />

        <div className="championship-details">
          <ProgressionSection summary={progressSummary} />
          <RecentActivity sessions={recent} />
        </div>

        <div className="championship-support">
          <FocusSection intelligence={intelligence} plan={plan} />
          <ClubCard summary={clubSummary} />
        </div>

        <QuickActions />
        </div>
    </main>
  );
}

function Hero({
  displayName,
  sessionCount,
  lastSessionDate,
  highPriorityCount,
  imageSrc,
}: {
  displayName: string | null;
  sessionCount: number;
  lastSessionDate: string | null;
  highPriorityCount: number;
  imageSrc: string;
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
    <section className="championship-hero" aria-label="Votre entraînement">
      <Image src={imageSrc} alt="Entraînement de boxe dans une salle sombre" fill priority sizes="(max-width: 767px) 100vw, 700px" className="championship-fighter" />
      <div className="championship-hero-tools">
        <Link href="/search" aria-label="Rechercher"><SearchIcon size={16} /></Link>
        <Link href="/goals" aria-label="Mes objectifs"><Flag size={16} /></Link>
        <Link href="/training" aria-label="Historique des séances"><CalendarClock size={16} /></Link>
      </div>
      <div className="championship-hero-copy">
        <p>{displayName ? `Bonjour, ${displayName}` : "Votre espace d’entraînement"}</p>
        <h1>La discipline<br />forge les<br />champions.</h1>
        <p className="championship-status">{status}</p>
      </div>
      <div className="championship-hero-footer">
        <span>{sessionCount > 0 ? `${sessionCount} séance${sessionCount > 1 ? "s" : ""} enregistrée${sessionCount > 1 ? "s" : ""}` : "Votre parcours commence ici"}</span>
        <Button size="sm" render={<Link href="/training/new" />}><Dumbbell /> Nouvelle séance</Button>
      </div>
    </section>
  );
}

function StatRow({
  plan,
  proficientPct,
  progressSummary,
}: {
  plan: TrainingPlanResult;
  proficientPct: number;
  progressSummary: SkillProgressSummary;
}) {
  const hasPlan = plan.status === "ok";
  const p = hasPlan ? plan.plan : null;
  const copy = p ? TRAINING_PLAN_ACTION_COPY[p.actionType] : null;
  const insufficientData = progressSummary.totalTracked === 0;

  return (
    <div className="championship-stats">
      <ImageMetricPanel
        label="Focus du jour"
        imageSrc={PHOTOS.focus.src}
        objectPosition={PHOTOS.focus.position}
        imageAlt="Un boxeur travaille sa garde à contre-jour"
        href={p ? `/skills/${p.focusSkillId}` : "/training/new"}
        title={p ? p.focusSkillName : "Définir mon focus"}
        detail={p ? p.reasons[0] : "Enregistrez une séance pour identifier vos priorités."}
      />
      <ImageMetricPanel
        label="Prochaine séance"
        imageSrc={PHOTOS.session.src}
        objectPosition={PHOTOS.session.position}
        imageAlt="Travail au sol"
        href="/training/new"
        title={p ? ACTION_TYPE_LABELS[p.actionType] : "Planifier une séance"}
        detail={copy?.drillHint ?? "Choisissez les techniques de votre prochain entraînement."}
      />
      <ProgressionCompactCard summary={progressSummary} ring={proficientPct} insufficientData={insufficientData} />
    </div>
  );
}

function ImageMetricPanel({
  label,
  imageSrc,
  imageAlt,
  objectPosition,
  href,
  title,
  detail,
}: {
  label: string;
  imageSrc: string;
  imageAlt: string;
  objectPosition: string;
  href: string;
  title: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <Link href={href} className="championship-image-panel">
      <ProgressiveImage src={imageSrc} alt={imageAlt} fill sizes="(max-width: 767px) 100vw, 40vw" style={{ objectPosition }} />
      <span className="championship-image-panel-copy">
        <span className="championship-image-panel-label">{label}</span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <ArrowUpRight className="championship-image-panel-arrow" aria-hidden="true" />
    </Link>
  );
}

function ProgressionCompactCard({
  summary,
  ring,
  insufficientData,
}: {
  summary: SkillProgressSummary;
  ring: number;
  insufficientData: boolean;
}) {
  const stages = MASTERY_STAGES.filter((s) => s !== "unknown" && s !== "introduced");
  return (
    <Card className="championship-progress-compact rounded-2xl border-border bg-card">
      <ProgressiveImage src={PHOTOS.globalProgress.src} alt="Combattant célébrant une victoire" fill sizes="(max-width: 767px) 100vw, 30vw" style={{ objectPosition: PHOTOS.globalProgress.position }} />
      <div className="championship-progress-compact-shade" aria-hidden="true" />
      <CardContent className="flex items-center gap-4 p-4">
        {insufficientData ? <Target className="size-9 shrink-0 text-muted-foreground" aria-hidden="true" /> : <ProgressRing value={ring} size={72} strokeWidth={5} />}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Progression globale
          </span>
          {!insufficientData && <span className="text-[10px] text-muted-foreground">{ring}% régulières ou maîtrisées · {summary.totalTracked} suivies</span>}
          {insufficientData ? (
            <span className="text-xs text-muted-foreground">Pas encore de données</span>
          ) : (
            stages.map((stage) => {
              const count = summary.stageCounts[stage] ?? 0;
              const pct = summary.totalTracked > 0 ? Math.round((count / summary.totalTracked) * 100) : 0;
              return (
                <div key={stage} className="flex items-center gap-1.5">
                  <span className="w-14 shrink-0 truncate text-[10px] text-muted-foreground">
                    {MASTERY_STAGE_LABELS[stage]}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4 shrink-0 text-right text-[10px] font-bold">{count}</span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeading({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 text-primary" aria-hidden="true" />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
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
        <SectionHeading icon={Target} label="À travailler maintenant" />
        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="flex flex-col items-start gap-2 py-6">
            <Target className="size-6 text-muted-foreground" />
            <p className="font-medium">Votre prochain focus se construit ici</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Enregistrez les techniques et difficultés de vos séances pour obtenir des recommandations adaptées.
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
      <SectionHeading icon={Target} label="Autres priorités" />

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
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium leading-snug">{rec.skillName}</span>
          <Badge variant={isHigh ? "default" : "secondary"} className="shrink-0">
            {PRIORITY_LABELS[rec.priority]}
          </Badge>
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground">{rec.reasons[0]}</p>
        {rec.reasons.length > 1 ? (
          <p className="text-[11px] text-muted-foreground">+{rec.reasons.length - 1} autre(s) signal(aux)</p>
        ) : null}

        <p className="flex items-start gap-1.5 text-xs">
          <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{rec.action}</span>
        </p>

        <Link
          href={`/skills/${rec.skillId}`}
          className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Voir le skill <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

function ProgressionSection({ summary }: { summary: SkillProgressSummary }) {
  const proficientCount = (summary.stageCounts.consistent ?? 0) + (summary.stageCounts.mastered ?? 0);
  const proficientPct =
    summary.totalTracked > 0 ? Math.round((proficientCount / summary.totalTracked) * 100) : 0;

  return (
    <Card className="championship-progress-panel rounded-2xl border-border bg-card">
      <ProgressiveImage src={PHOTOS.progress.src} alt="Deux combattantes travaillent leurs déplacements" fill sizes="(max-width: 767px) 100vw, 50vw" style={{ objectPosition: PHOTOS.progress.position }} />
      <div className="championship-progress-shade" aria-hidden="true" />
      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <TrendingUp className="size-3.5 text-primary" />
          Progression détaillée
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        {summary.totalTracked === 0 ? (
          <div className="championship-progress-empty">
            <strong>Construisez votre carte de progression.</strong>
            <p>
              Ajoutez les techniques travaillées à vos séances pour suivre chaque discipline.
            </p>
            <Button size="sm" render={<Link href="/training/new" />}>
              Ajouter une séance <ArrowRight />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <ProgressRing value={proficientPct} size={80} strokeWidth={7} />
            <div className="flex flex-1 flex-col gap-2">
              {summary.disciplines.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune discipline suivie.</p>
              ) : (
                summary.disciplines.slice(0, 5).map((d) => (
                  <DisciplineBar key={d.name} name={d.name} count={d.count} total={summary.totalTracked} />
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DisciplineBar({ name, count, total }: { name: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">{name}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
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
    <Card data-empty={sessions.length === 0 || undefined} className="championship-activity-panel rounded-2xl border-border bg-card">
      <div className="championship-activity-cover">
        <ProgressiveImage src={PHOTOS.activity.src} alt="Séance de grappling" fill sizes="(max-width: 767px) 100vw, 50vw" style={{ objectPosition: PHOTOS.activity.position }} />
        <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Flame className="size-3.5 text-primary" />
          Dernières activités
        </CardTitle>
        </CardHeader>
      </div>
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
                  className={`flex gap-3 pb-3.5 ${
                    i < sessions.length - 1 ? "border-b border-border/60 mb-1" : ""
                  }`}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold uppercase text-primary-foreground">
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

function ClubCard({ summary }: { summary: MemberClubSummary | null }) {
  if (!summary) return null;

  const attendanceMeta =
    summary.attendance.marked > 0 ? `${summary.attendance.rate}% de présence · 30 j` : "Pas encore de données";

  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <UsersRound className="size-3.5 text-primary" />
          Mon club
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr_1fr]">
        <div className="flex items-center gap-3">
          <Image
            src={PHOTOS.club}
            alt="Deux partenaires s'entraînent au gym"
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-full object-cover ring-2 ring-primary/20"
            style={{ objectPosition: "80% center" }}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-bold">{summary.groupNames[0] ?? "Voir mes clubs"}</span>
            <span className="text-xs text-muted-foreground">{attendanceMeta}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Prochains cours
          </span>
          {summary.upcomingClasses.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun cours dans les 7 prochains jours.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {summary.upcomingClasses.slice(0, 3).map((c) => (
                <li key={c.session_id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium">{c.class_name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(c.starts_at).toLocaleString("fr-FR", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Groupes</span>
          <div className="flex flex-wrap gap-1.5">
            {summary.groupNames.length === 0 ? (
              <span className="text-xs text-muted-foreground">Aucun groupe.</span>
            ) : (
              summary.groupNames.map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))
            )}
          </div>
          <Link
            href="/club"
            className="mt-auto inline-flex w-fit items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Voir mes clubs <ArrowRight className="size-3.5" />
          </Link>
        </div>
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
    <section className="championship-shortcuts">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link key={a.href} href={a.href} className="group">
            <Card className="rounded-xl border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-2 p-3">
                <Icon className="size-4 text-primary" />
                <span className="text-xs font-medium leading-tight">{a.label}</span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </section>
  );
}
