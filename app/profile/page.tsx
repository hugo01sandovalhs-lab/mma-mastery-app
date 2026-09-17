import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic } from "@/components/championship/section-photo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Profile } from "@/lib/domain/profile";
import type { TrainingPartner } from "@/lib/domain/training-partner";
import { TrainingPartners } from "@/components/profile/training-partners";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: partners }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.rpc("list_training_partners"),
  ]);

  return (
    <AppShell>
      <div className="editorial-page editorial-profile">
      <PageHeader page="profile" title="Profil" description="Votre identité, votre parcours." />
      <ChampionshipPhotoMosaic page="profile" />
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-5 text-sm text-muted-foreground">Compte : {user.email}</p>
          <ProfileForm profile={profile as Profile | null} />
        </CardContent>
      </Card>
      <TrainingPartners
        friendCode={(profile as Profile | null)?.friend_code ?? ""}
        partners={((partners ?? []) as Array<{ relationship_id: string; partner_user_id: string; display_name: string }>).map((partner) => ({
          relationshipId: partner.relationship_id,
          userId: partner.partner_user_id,
          displayName: partner.display_name,
          avatarUrl: null,
        } satisfies TrainingPartner))}
      />
      </div>
    </AppShell>
  );
}
