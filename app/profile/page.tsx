import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Profile } from "@/lib/domain/profile";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <AppShell>
      <div className="editorial-page editorial-profile">
      <PageHeader page="profile" title="Profil" description="Votre identité, votre parcours." />
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-5 text-sm text-muted-foreground">Compte : {user.email}</p>
          <ProfileForm profile={profile as Profile | null} />
        </CardContent>
      </Card>
      </div>
    </AppShell>
  );
}
