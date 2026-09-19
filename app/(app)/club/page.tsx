import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, UserRoundPlus, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { PHOTO_STORIES } from "@/lib/design/photography";
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
  const [coursPhoto, collectifPhoto, partenairesPhoto] = PHOTO_STORIES.club;

  return (
    <AppShell>
      <div className="editorial-page editorial-club">
        <PageHeader page="club" title="Clubs & partenaires" description="Progresser ensemble. Invitez vos amis d’entraînement et organisez vos groupes." />

        <div className="club-paths">
          <section id="cours">
            <ProgressiveImage src={coursPhoto.src} alt={coursPhoto.alt} fill sizes="(max-width: 767px) 100vw, 33vw" style={{ objectPosition: coursPhoto.position }} />
            <div className="club-path-shade" aria-hidden="true" />
            <BookOpen aria-hidden="true" /><h2>Cours</h2><p>Retrouvez le planning et les séances de votre club.</p>
            <Button variant="outline" size="sm" render={<Link href={primaryClub ? `/club/${primaryClub.id}/classes` : "#creer-un-club"} />}>{primaryClub ? "Voir les cours" : "Créer un club"}</Button>
          </section>
          <section id="collectif">
            <ProgressiveImage src={collectifPhoto.src} alt={collectifPhoto.alt} fill sizes="(max-width: 767px) 100vw, 33vw" style={{ objectPosition: collectifPhoto.position }} />
            <div className="club-path-shade" aria-hidden="true" />
            <UsersRound aria-hidden="true" /><h2>Collectif</h2><p>Suivez les membres, événements et annonces du groupe.</p>
            <Button variant="outline" size="sm" render={<Link href={primaryClub ? `/club/${primaryClub.id}` : "#creer-un-club"} />}>{primaryClub ? "Ouvrir le collectif" : "Créer un club"}</Button>
          </section>
          <section id="partenaires">
            <ProgressiveImage src={partenairesPhoto.src} alt={partenairesPhoto.alt} fill sizes="(max-width: 767px) 100vw, 33vw" style={{ objectPosition: partenairesPhoto.position }} />
            <div className="club-path-shade" aria-hidden="true" />
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
