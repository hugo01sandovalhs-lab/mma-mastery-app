import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, UserRoundPlus, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic } from "@/components/championship/section-photo";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getMyClubs } from "@/lib/usecases/club-actions";
import { ClubForm } from "@/components/club/club-form";
import { ClubRow } from "@/components/club/club-row";
import { Button } from "@/components/ui/button";

export default async function ClubListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clubs = await getMyClubs();
  const primaryClub = clubs[0];

  return (
    <AppShell>
      <div className="editorial-page editorial-club">
        <PageHeader page="club" title="Clubs & partenaires" description="Progresser ensemble. Invitez vos amis d’entraînement et organisez vos groupes." />

        <ChampionshipPhotoMosaic page="club" />

        <div className="club-paths">
          <section id="cours">
            <BookOpen aria-hidden="true" /><h2>Cours</h2><p>Retrouvez le planning et les séances de votre club.</p>
            <Button variant="outline" size="sm" render={<Link href={primaryClub ? `/club/${primaryClub.id}/classes` : "#creer-un-club"} />}>{primaryClub ? "Voir les cours" : "Créer un club"}</Button>
          </section>
          <section id="collectif">
            <UsersRound aria-hidden="true" /><h2>Collectif</h2><p>Suivez les membres, événements et annonces du groupe.</p>
            <Button variant="outline" size="sm" render={<Link href={primaryClub ? `/club/${primaryClub.id}` : "#creer-un-club"} />}>{primaryClub ? "Ouvrir le collectif" : "Créer un club"}</Button>
          </section>
          <section id="partenaires">
            <UserRoundPlus aria-hidden="true" /><h2>Partenaires</h2><p>Invitez un partenaire avec votre code ami et progressez ensemble.</p>
            <Button variant="outline" size="sm" render={<Link href="/profile#partenaires" />}>Gérer mes partenaires</Button>
          </section>
        </div>

        <div className="editorial-secondary-columns">
        <section id="creer-un-club" className="editorial-section">
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
