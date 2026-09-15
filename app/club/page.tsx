import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getMyClubs } from "@/lib/usecases/club-actions";
import { ClubForm } from "@/components/club/club-form";
import { ClubRow } from "@/components/club/club-row";

export default async function ClubListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clubs = await getMyClubs();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Clubs</h1>
          </div>
          <p className="text-sm text-muted-foreground">Vos clubs, membres et groupes.</p>
        </div>

        <ClubForm />

        {clubs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Aucun club pour l&apos;instant.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {clubs.map((c) => (
              <ClubRow key={c.id} club={c} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
