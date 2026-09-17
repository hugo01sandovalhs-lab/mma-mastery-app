import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic } from "@/components/championship/section-photo";
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
      <div className="editorial-page editorial-club">
        <PageHeader page="club" title="Clubs & partenaires" description="Progresser ensemble. Invitez vos amis d’entraînement et organisez vos groupes." />

        <ChampionshipPhotoMosaic page="club" />

        <div className="editorial-secondary-columns">
        <section className="editorial-section">
        <h2>Créer un club</h2>
        <ClubForm />
        </section>

        <section className="editorial-section">
        <h2>Vos clubs</h2>
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
        </section>
        </div>
      </div>
    </AppShell>
  );
}
