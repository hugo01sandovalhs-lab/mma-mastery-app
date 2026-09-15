import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { hasClubRoleAtLeast } from "@/lib/domain/club";
import { getClub } from "@/lib/usecases/club-actions";
import { getClasses } from "@/lib/usecases/class-actions";
import { ClassForm } from "@/components/club/class-form";
import { ClassRow } from "@/components/club/class-row";

export default async function ClubClassesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const club = await getClub(id);
  if (!club) notFound();

  const classes = await getClasses(id);
  const canManage = hasClubRoleAtLeast(club.myRole, "COACH");

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link href={`/club/${id}`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {club.name}
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Cours</h1>
          <p className="text-sm text-muted-foreground">Horaires, séances et présence.</p>
        </div>

        {canManage ? (
          <ClassForm clubId={id} groups={club.groups.map((g) => ({ id: g.id, name: g.name }))} />
        ) : null}

        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">Aucun cours pour l&apos;instant.</CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {classes.map((c) => (
              <ClassRow key={c.id} cls={c} clubId={id} canManage={canManage} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
