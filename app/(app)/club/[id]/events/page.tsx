import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { hasClubRoleAtLeast, type ClubRole } from "@/lib/domain/club";
import { getClubEvents } from "@/lib/usecases/club-event-actions";
import { EventForm } from "@/components/club/event-form";
import { EventRow } from "@/components/club/event-row";

export default async function ClubEventsPage({ params }: { params: Promise<{ id: string }> }) {
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
  const events = await getClubEvents(id);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link href={`/club/${id}`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {club.name}
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Événements</h1>
          <p className="text-sm text-muted-foreground">Interclubs, compétitions et stages du club.</p>
        </div>

        {canManage ? <EventForm clubId={id} /> : null}

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">Aucun événement pour l&apos;instant.</CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((e) => (
              <EventRow key={e.id} event={e} clubId={id} canManage={canManage} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
