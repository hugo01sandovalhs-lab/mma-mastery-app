import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { CLUB_ROLE_LABELS, hasClubRoleAtLeast } from "@/lib/domain/club";
import { getClub } from "@/lib/usecases/club-actions";
import { InviteForm } from "@/components/club/invite-form";
import { MemberRow } from "@/components/club/member-row";
import { GroupForm } from "@/components/club/group-form";
import { GroupCard } from "@/components/club/group-card";

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const club = await getClub(id);
  if (!club) notFound();

  const canManageMembers = hasClubRoleAtLeast(club.myRole, "ADMIN");
  const canManageGroups = hasClubRoleAtLeast(club.myRole, "COACH");

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link href="/club" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Clubs
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{club.name}</h1>
            <Badge variant="outline">{CLUB_ROLE_LABELS[club.myRole]}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Membres</h2>
          {canManageMembers ? <InviteForm clubId={club.id} /> : null}
          <div className="flex flex-col gap-2">
            {club.members.map((m) => (
              <MemberRow key={m.id} member={m} clubId={club.id} canManage={canManageMembers} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Groupes</h2>
          {canManageGroups ? <GroupForm clubId={club.id} /> : null}
          {club.groups.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">Aucun groupe pour l&apos;instant.</CardContent>
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
