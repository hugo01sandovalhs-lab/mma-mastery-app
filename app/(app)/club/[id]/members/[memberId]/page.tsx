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
      </div>
    </AppShell>
  );
}
