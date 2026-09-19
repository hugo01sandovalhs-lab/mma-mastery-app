import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { hasClubRoleAtLeast } from "@/lib/domain/club";
import { checkinCodeIsValid } from "@/lib/domain/class";
import { getClub } from "@/lib/usecases/club-actions";
import { getClassDetail } from "@/lib/usecases/class-actions";
import { renderCheckinQrSvg } from "@/lib/infra/qr";
import { ClassSessionForm } from "@/components/club/class-session-form";
import { SessionCard } from "@/components/club/session-card";
import { T } from "@/components/i18n-provider";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, formatT } from "@/lib/i18n";

const WEEKDAY_KEYS = ["weekday.0", "weekday.1", "weekday.2", "weekday.3", "weekday.4", "weekday.5", "weekday.6"] as const;

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string; classId: string }>;
}) {
  const { id, classId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const club = await getClub(id);
  if (!club) notFound();

  const [classDetail, locale] = await Promise.all([getClassDetail(classId), getServerLocale()]);
  if (!classDetail || classDetail.club_id !== id) notFound();
  const dict = DICTIONARIES[locale];

  const canManage = hasClubRoleAtLeast(club.myRole, "COACH");

  const group = classDetail.group_id ? club.groups.find((g) => g.id === classDetail.group_id) : undefined;
  const roster = group ? group.members : club.members.map((m) => ({ user_id: m.user_id, display_name: m.display_name }));

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  const qrByCode = new Map<string, string>();
  if (canManage && origin) {
    for (const s of classDetail.sessions) {
      if (s.checkin_code && checkinCodeIsValid(s.checkin_code_expires_at)) {
        qrByCode.set(s.checkin_code, await renderCheckinQrSvg(`${origin}/checkin/${s.checkin_code}`));
      }
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link
          href={`/club/${id}/classes`}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> <T k="photoLabel.classes" fallback="Cours" />
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{classDetail.name}</h1>
            {classDetail.group_name ? <Badge variant="outline">{classDetail.group_name}</Badge> : null}
          </div>
          {classDetail.day_of_week !== null ? (
            <p className="text-sm text-muted-foreground">
              {dict[WEEKDAY_KEYS[classDetail.day_of_week]]}
              {classDetail.start_time ? ` · ${classDetail.start_time.slice(0, 5)}` : ""}
              {classDetail.duration_minutes ? ` · ${classDetail.duration_minutes} min` : ""}
              {classDetail.capacity ? ` · ${formatT(dict["club.capacity"], { n: classDetail.capacity })}` : ""}
            </p>
          ) : null}
        </div>

        {canManage ? <ClassSessionForm clubId={id} classId={classId} /> : null}

        {classDetail.sessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground"><T k="club.noSessionsYet" fallback="Aucune séance pour l'instant." /></CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {classDetail.sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                clubId={id}
                classId={classId}
                roster={roster}
                viewerUserId={user.id}
                canManage={canManage}
                qrSvg={s.checkin_code ? (qrByCode.get(s.checkin_code) ?? null) : null}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
