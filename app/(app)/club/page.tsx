import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, UserRoundPlus, Users, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipSectionPhoto } from "@/components/championship/section-photo";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { PHOTO_STORIES } from "@/lib/design/photography";
import { getMyClubs } from "@/lib/usecases/club-actions";
import { ClubForm } from "@/components/club/club-form";
import { ClubRow } from "@/components/club/club-row";
import { Button } from "@/components/ui/button";
import { T } from "@/components/i18n-provider";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";

export default async function ClubListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [clubs, locale] = await Promise.all([getMyClubs(), getServerLocale()]);
  const dict = DICTIONARIES[locale];
  const primaryClub = clubs[0];
  const [coursPhoto, collectifPhoto, partenairesPhoto] = PHOTO_STORIES.club;

  return (
    <AppShell>
      <div className="editorial-page editorial-club">
        <PageHeader page="club" title={dict["page.club.title"]} description={<T k="club.description" fallback="Progresser ensemble. Invitez vos amis d’entraînement et organisez vos groupes." />} />

        <div className="club-paths">
          <section id="cours">
            <ProgressiveImage src={coursPhoto.src} alt={coursPhoto.alt} fill sizes="(max-width: 767px) 100vw, 33vw" style={{ objectPosition: coursPhoto.position }} />
            <div className="club-path-shade" aria-hidden="true" />
            <BookOpen aria-hidden="true" /><h2><T k="photoLabel.classes" fallback="Cours" /></h2><p><T k="club.classesDesc" fallback="Retrouvez le planning et les séances de votre club." /></p>
            <Button variant="outline" size="sm" render={<Link href={primaryClub ? `/club/${primaryClub.id}/classes` : "#creer-un-club"} />}>{primaryClub ? dict["club.viewClasses"] : dict["club.createClub"]}</Button>
          </section>
          <section id="collectif">
            <ProgressiveImage src={collectifPhoto.src} alt={collectifPhoto.alt} fill sizes="(max-width: 767px) 100vw, 33vw" style={{ objectPosition: collectifPhoto.position }} />
            <div className="club-path-shade" aria-hidden="true" />
            <UsersRound aria-hidden="true" /><h2><T k="photoLabel.collective" fallback="Collectif" /></h2><p><T k="club.collectiveDesc" fallback="Suivez les membres, événements et annonces du groupe." /></p>
            <Button variant="outline" size="sm" render={<Link href={primaryClub ? `/club/${primaryClub.id}` : "#creer-un-club"} />}>{primaryClub ? dict["club.openCollective"] : dict["club.createClub"]}</Button>
          </section>
          <section id="partenaires">
            <ProgressiveImage src={partenairesPhoto.src} alt={partenairesPhoto.alt} fill sizes="(max-width: 767px) 100vw, 33vw" style={{ objectPosition: partenairesPhoto.position }} />
            <div className="club-path-shade" aria-hidden="true" />
            <UserRoundPlus aria-hidden="true" /><h2><T k="photoLabel.partners" fallback="Partenaires" /></h2><p><T k="club.partnersDesc" fallback="Invitez un partenaire avec votre code ami et progressez ensemble." /></p>
            <Button variant="outline" size="sm" render={<Link href="/profile#partenaires" />}><T k="club.managePartners" fallback="Gérer mes partenaires" /></Button>
          </section>
        </div>

        <ChampionshipSectionPhoto
          src="/mma-mastery-photos/gmb-fitness-Ba3FAXwp3A8-unsplash.jpg"
          alt="Groupe de pratiquants réunis en cercle pour un briefing collectif"
          label="Collectif"
          labelKey="photoLabel.collective"
          icon={<Users className="size-4 shrink-0 text-primary" aria-hidden="true" />}
          objectPosition="50% 45%"
          size="large"
        />

        <div className="editorial-secondary-columns">
        <section id="creer-un-club" className="editorial-section">
        <h2><T k="club.createTitle" fallback="Créer un club" /></h2>
        <ClubForm />
        </section>

        <section className="editorial-section">
        <h2><T k="club.myClubs" fallback="Vos clubs" /></h2>
        {clubs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              <T k="club.noneYet" fallback="Aucun club pour l'instant." />
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
