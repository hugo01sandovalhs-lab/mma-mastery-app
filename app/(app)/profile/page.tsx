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
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, formatT } from "@/lib/i18n";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const [{ data: profile }, { data: partners }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.rpc("list_training_partners"),
  ]);

  return (
    <AppShell>
      <div className="editorial-page editorial-profile">
      <PageHeader page="profile" title={dict["page.profile.title"]} description={dict["page.profile.description"]} />
      <ChampionshipPhotoMosaic page="profile" />
      <Card>
        <CardHeader>
          <CardTitle>{dict["profile.personalInfo"]}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-5 text-sm text-muted-foreground">{formatT(dict["profile.account"], { email: user.email ?? "" })}</p>
          <ProfileForm profile={profile as Profile | null} />
        </CardContent>
      </Card>
      <div id="partenaires">
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
      </div>
    </AppShell>
  );
}
