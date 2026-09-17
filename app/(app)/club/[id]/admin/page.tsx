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

export default async function ClubAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const overview = await getClubAdminOverview(id);
  if (!overview) notFound();

  const hasAlerts = overview.membersWithoutGroup.length > 0 || overview.lowAttendanceSessions.length > 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link href={`/club/${id}`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {overview.clubName}
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Administration</h1>
          <p className="text-sm text-muted-foreground">Vue d&apos;ensemble du club, membres et présence.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ChampionshipMetricCard eyebrow="Membres" icon={Users} value={overview.totalMembers} />
          <ChampionshipMetricCard eyebrow="Groupes" icon={UsersRound} value={overview.groupCount} />
          <ChampionshipMetricCard eyebrow="Cours" icon={CalendarClock} value={overview.classCount} />
          <ChampionshipMetricCard
            eyebrow="Présence (30j)"
            icon={TrendingUp}
            value={`${overview.attendance.rate}%`}
            subtitle={`${overview.attendance.present}/${overview.attendance.marked} présences`}
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Répartition des rôles</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(overview.memberCountsByRole)
              .filter(([, count]) => count > 0)
              .map(([role, count]) => (
                <Badge key={role} variant="outline">
                  {CLUB_ROLE_LABELS[role as keyof typeof CLUB_ROLE_LABELS]}: {count}
                </Badge>
              ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
            <AlertTriangle className="size-4 text-primary" /> Alertes
          </h2>
          {!hasAlerts ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">Rien à signaler.</CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {overview.membersWithoutGroup.length > 0 ? (
                <Card>
                  <CardContent className="flex flex-col gap-2 py-4">
                    <span className="text-sm font-medium">
                      {overview.membersWithoutGroup.length} membre(s) sans groupe
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {overview.membersWithoutGroup.map((m) => (
                        <Link key={m.user_id} href={`/club/${id}/members/${m.user_id}`}>
                          <Badge variant="outline" className="hover:bg-accent">
                            {m.display_name ?? "Membre"}
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
                        {new Date(s.starts_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {s.present}/{s.marked} présents
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
