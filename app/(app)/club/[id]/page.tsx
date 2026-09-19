import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, LayoutDashboard, Megaphone, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { CLUB_ROLE_LABELS, hasClubRoleAtLeast } from "@/lib/domain/club";
import { getClub } from "@/lib/usecases/club-actions";
import { getUnreadAnnouncementCount } from "@/lib/usecases/club-announcement-actions";
import { InviteForm } from "@/components/club/invite-form";
import { MemberRow } from "@/components/club/member-row";
import { GroupForm } from "@/components/club/group-form";
import { GroupCard } from "@/components/club/group-card";
import { T } from "@/components/i18n-provider";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [club, unreadAnnouncements, locale] = await Promise.all([
    getClub(id),
    getUnreadAnnouncementCount(id),
    getServerLocale(),
  ]);
  if (!club) notFound();

  const dict = DICTIONARIES[locale];

  const canManageMembers = hasClubRoleAtLeast(club.myRole, "ADMIN");
  const canManageGroups = hasClubRoleAtLeast(club.myRole, "COACH");
  const canSeeAdmin = hasClubRoleAtLeast(club.myRole, "COACH");

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link href="/club" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> <T k="page.club.title" fallback="Clubs" />
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{club.name}</h1>
            <Badge variant="outline">{dict[`clubRole.${club.myRole}` as keyof typeof dict] ?? CLUB_ROLE_LABELS[club.myRole]}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link
              href={`/club/${club.id}/classes`}
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <CalendarClock className="size-3.5" /> <T k="club.classesAttendance" fallback="Cours et présence" />
            </Link>
            <Link
              href={`/club/${club.id}/events`}
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Trophy className="size-3.5" /> <T k="club.events" fallback="Événements" />
            </Link>
            <Link
              href={`/club/${club.id}/announcements`}
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Megaphone className="size-3.5" /> <T k="club.announcements" fallback="Annonces" />
              {unreadAnnouncements > 0 ? <Badge variant="default">{unreadAnnouncements}</Badge> : null}
            </Link>
            {canSeeAdmin ? (
              <Link
                href={`/club/${club.id}/admin`}
                className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="size-3.5" /> <T k="club.administration" fallback="Administration" />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight"><T k="club.members" fallback="Membres" /></h2>
          {canManageMembers ? <InviteForm clubId={club.id} /> : null}
          <div className="flex flex-col gap-2">
            {club.members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                clubId={club.id}
                canManage={canManageMembers}
                detailHref={canSeeAdmin ? `/club/${club.id}/members/${m.user_id}` : undefined}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight"><T k="club.groups" fallback="Groupes" /></h2>
          {canManageGroups ? <GroupForm clubId={club.id} /> : null}
          {club.groups.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground"><T k="club.noGroupsYet" fallback="Aucun groupe pour l'instant." /></CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {club.groups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  clubId={club.id}
                  clubMembers={club.members}
                  canManage={canManageGroups}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
