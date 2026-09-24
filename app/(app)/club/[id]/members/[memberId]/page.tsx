import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { CLUB_ROLE_LABELS } from "@/lib/domain/club";
import { ATTENDANCE_STATUS_LABEL_KEYS } from "@/lib/domain/class";
import { getMemberDetail } from "@/lib/usecases/club-admin-actions";
import { T } from "@/components/i18n-provider";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, type Locale } from "@/lib/i18n";

const INTL_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ru: "ru-RU", ja: "ja-JP" };

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const { id, memberId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [member, locale] = await Promise.all([getMemberDetail(id, memberId), getServerLocale()]);
  if (!member) notFound();
  const dict = DICTIONARIES[locale];
  const intlLocale = INTL_LOCALE[locale];

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link href={`/club/${id}/admin`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> <T k="club.administration" fallback="Administration" />
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {member.displayName ?? dict["clubRole.MEMBER" as keyof typeof dict] ?? "Membre"}
            </h1>
            <Badge variant="outline">{dict[`clubRole.${member.role}` as keyof typeof dict] ?? CLUB_ROLE_LABELS[member.role]}</Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            <T k="club.memberSince" fallback="Membre depuis {date}" vars={{ date: new Date(member.memberSince).toLocaleDateString(intlLocale, { dateStyle: "medium" }) }} />
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight"><T k="club.groups" fallback="Groupes" /></h2>
          <div className="flex flex-wrap gap-2">
            {member.groups.length === 0 ? (
              <span className="text-sm text-muted-foreground"><T k="club.noGroup" fallback="Aucun groupe." /></span>
            ) : (
              member.groups.map((g) => (
                <Badge key={g.id} variant="outline">
                  {g.name}
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold tracking-tight"><T k="club.attendance" fallback="Présence" /></h2>
            <Badge variant="outline"><T k="club.attendanceRate" fallback="{rate}% de présence" vars={{ rate: member.attendanceRate }} /></Badge>
          </div>
          {member.attendance.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground"><T k="club.noAttendance" fallback="Aucune présence enregistrée." /></CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {member.attendance.map((a) => (
                <Card key={a.session_id}>
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{a.class_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.starts_at).toLocaleString(intlLocale, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <Badge variant={a.status === "present" ? "default" : "outline"}>
                      {dict[ATTENDANCE_STATUS_LABEL_KEYS[a.status]]}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Progression partagée</h2>
          {member.shared.categories.length === 0 ? (
            <Card><CardContent className="py-8 text-sm text-muted-foreground">Ce membre ne partage actuellement aucune donnée de progression.</CardContent></Card>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              <Card><CardContent className="py-4">
                <p className="mb-3 text-sm font-semibold">Activité récente</p>
                {member.shared.recentSessions.length === 0 ? <p className="text-sm text-muted-foreground">Aucune séance partagée récente.</p> : (
                  <ul className="space-y-2 text-sm">{member.shared.recentSessions.map((session) => (
                    <li key={session.id} className="flex justify-between gap-3"><span>{session.title || session.session_type}</span><span className="text-muted-foreground">{new Date(session.date).toLocaleDateString(intlLocale)}</span></li>
                  ))}</ul>
                )}
              </CardContent></Card>
              <Card><CardContent className="py-4">
                <p className="mb-3 text-sm font-semibold">Compétences</p>
                {member.shared.skills.length === 0 ? <p className="text-sm text-muted-foreground">Données insuffisantes.</p> : (
                  <ul className="space-y-2 text-sm">{member.shared.skills.map((skill) => (
                    <li key={skill.skillName} className="flex justify-between gap-3"><span>{skill.skillName}</span><span className="text-muted-foreground">{skill.evidenceCount} preuves</span></li>
                  ))}</ul>
                )}
              </CardContent></Card>
              <Card><CardContent className="py-4">
                <p className="mb-3 text-sm font-semibold">Difficultés et questions</p>
                {member.shared.observations.length === 0 ? <p className="text-sm text-muted-foreground">Aucune donnée partagée.</p> : (
                  <ul className="space-y-2 text-sm">{member.shared.observations.map((item, index) => <li key={`${item.date}-${index}`}><Badge variant="outline">{item.type}</Badge> <span className="ml-1">{item.content}</span></li>)}</ul>
                )}
              </CardContent></Card>
              <Card><CardContent className="py-4">
                <p className="mb-3 text-sm font-semibold">Objectifs et vidéos</p>
                {member.shared.goals.length + member.shared.resources.length === 0 ? <p className="text-sm text-muted-foreground">Aucune donnée partagée.</p> : (
                  <ul className="space-y-2 text-sm">
                    {member.shared.goals.map((goal) => <li key={goal.id}>{goal.title} <Badge variant="outline">{goal.status}</Badge></li>)}
                    {member.shared.resources.map((resource) => <li key={resource.id}><a className="underline" href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a></li>)}
                  </ul>
                )}
              </CardContent></Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
