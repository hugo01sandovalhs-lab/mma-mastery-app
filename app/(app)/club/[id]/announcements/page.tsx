import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { hasClubRoleAtLeast, type ClubRole } from "@/lib/domain/club";
import { getClubAnnouncements } from "@/lib/usecases/club-announcement-actions";
import { AnnouncementForm } from "@/components/club/announcement-form";
import { AnnouncementRow } from "@/components/club/announcement-row";
import { MarkAnnouncementsRead } from "@/components/club/mark-announcements-read";
import { T } from "@/components/i18n-provider";

export default async function ClubAnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabase.from("clubs").select("id, name").eq("id", id).maybeSingle();
  if (!club) notFound();

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) notFound();

  const canManage = hasClubRoleAtLeast(membership.role as ClubRole, "COACH");
  const [announcements, groupsResult] = await Promise.all([
    getClubAnnouncements(id),
    canManage ? supabase.from("groups").select("id, name").eq("club_id", id) : Promise.resolve({ data: [] }),
  ]);
  const groups = (groupsResult.data ?? []) as { id: string; name: string }[];

  return (
    <AppShell>
      <MarkAnnouncementsRead clubId={id} />
      <div className="flex flex-col gap-8">
        <Link href={`/club/${id}`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {club.name}
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl"><T k="club.announcements" fallback="Annonces" /></h1>
          <p className="text-sm text-muted-foreground"><T k="club.announcementsDesc" fallback="Communications du club et des groupes." /></p>
        </div>

        {canManage ? <AnnouncementForm clubId={id} groups={groups} /> : null}

        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground"><T k="club.noAnnouncements" fallback="Aucune annonce pour l'instant." /></CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {announcements.map((a) => (
              <AnnouncementRow key={a.id} announcement={a} clubId={id} canManage={canManage} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
