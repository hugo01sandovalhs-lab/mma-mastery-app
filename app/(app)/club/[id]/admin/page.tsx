import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users, UsersRound, CalendarClock, TrendingUp, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChampionshipMetricCard } from "@/components/championship/metric-card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { CLUB_ROLE_LABELS } from "@/lib/domain/club";
import { getClubAdminOverview } from "@/lib/usecases/club-admin-actions";
import { T } from "@/components/i18n-provider";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";

const INTL_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ru: "ru-RU", ja: "ja-JP" };

export default async function ClubAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [overview, locale] = await Promise.all([getClubAdminOverview(id), getServerLocale()]);
  if (!overview) notFound();
  const dict = DICTIONARIES[locale];
  const intlLocale = INTL_LOCALE[locale];

  const hasAlerts = overview.membersWithoutGroup.length > 0 || overview.lowAttendanceSessions.length > 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link href={`/club/${id}`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {overview.clubName}
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"><T k="club.administration" fallback="Administration" /></h1>
          <p className="text-sm text-muted-foreground"><T k="club.adminOverview" fallback="Vue d'ensemble du club, membres et présence." /></p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ChampionshipMetricCard eyebrow={dict["club.members"]} icon={Users} value={overview.totalMembers} />
          <ChampionshipMetricCard eyebrow={dict["club.groups"]} icon={UsersRound} value={overview.groupCount} />
          <ChampionshipMetricCard eyebrow={dict["photoLabel.classes"]} icon={CalendarClock} value={overview.classCount} />
          <ChampionshipMetricCard
            eyebrow={dict["club.attendance30d"]}
            icon={TrendingUp}
            value={`${overview.attendance.rate}%`}
            subtitle={formatT(dict["club.presentCount"], { present: overview.attendance.present, marked: overview.attendance.marked })}
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Synthèse de l’équipe</h2>
          <div className="grid gap-3 lg:grid-cols-3">
            <Card><CardContent className="py-4"><p className="text-sm text-muted-foreground">Volume partagé, 14 jours</p><strong className="mt-1 block text-2xl">{overview.teamInsights.recentSessionCount}</strong><span className="text-xs text-muted-foreground">séances partagées</span></CardContent></Card>
            <Card><CardContent className="py-4"><p className="mb-2 text-sm font-medium">Difficultés fréquentes</p>{overview.teamInsights.recurringDifficulties.length ? <ul className="space-y-1 text-sm">{overview.teamInsights.recurringDifficulties.map((item) => <li key={item.label}>{item.label} <Badge variant="outline">{item.count}</Badge></li>)}</ul> : <p className="text-sm text-muted-foreground">Données insuffisantes.</p>}</CardContent></Card>
            <Card><CardContent className="py-4"><p className="mb-2 text-sm font-medium">Sujets vidéo recherchés</p>{overview.teamInsights.searchedTopics.length ? <ul className="space-y-1 text-sm">{overview.teamInsights.searchedTopics.map((item) => <li key={item.label}>{item.label} <Badge variant="outline">{item.count}</Badge></li>)}</ul> : <p className="text-sm text-muted-foreground">Données insuffisantes.</p>}</CardContent></Card>
          </div>
          {overview.teamInsights.inactiveMembers.length ? <Card><CardContent className="py-4"><p className="mb-2 text-sm font-medium">Sans séance partagée ces 14 derniers jours</p><div className="flex flex-wrap gap-2">{overview.teamInsights.inactiveMembers.map((member) => <Link key={member.user_id} href={`/club/${id}/members/${member.user_id}`}><Badge variant="outline">{member.display_name ?? "Membre"}</Badge></Link>)}</div></CardContent></Card> : null}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight"><T k="club.roleBreakdown" fallback="Répartition des rôles" /></h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(overview.memberCountsByRole)
              .filter(([, count]) => count > 0)
              .map(([role, count]) => (
                <Badge key={role} variant="outline">
                  {dict[`clubRole.${role}` as keyof typeof dict] ?? CLUB_ROLE_LABELS[role as keyof typeof CLUB_ROLE_LABELS]}: {count}
                </Badge>
              ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
            <AlertTriangle className="size-4 text-primary" /> <T k="club.alerts" fallback="Alertes" />
          </h2>
          {!hasAlerts ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground"><T k="club.nothingToReport" fallback="Rien à signaler." /></CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {overview.membersWithoutGroup.length > 0 ? (
                <Card>
                  <CardContent className="flex flex-col gap-2 py-4">
                    <span className="text-sm font-medium">
                      <T k="club.membersWithoutGroup" fallback="{count} membre(s) sans groupe" vars={{ count: overview.membersWithoutGroup.length }} />
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {overview.membersWithoutGroup.map((m) => (
                        <Link key={m.user_id} href={`/club/${id}/members/${m.user_id}`}>
                          <Badge variant="outline" className="hover:bg-accent">
                            {m.display_name ?? dict["clubRole.MEMBER"]}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
              {overview.lowAttendanceSessions.map((s) => (
                <Card key={s.session_id}>
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{s.class_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.starts_at).toLocaleString(intlLocale, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <Badge variant="outline">
                      <T k="club.presentOf" fallback="{present}/{marked} présents" vars={{ present: s.present, marked: s.marked }} />
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
