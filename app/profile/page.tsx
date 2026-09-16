import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";

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
    .select("display_name")
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
          <dl className="editorial-profile-details">
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Nom affiché</dt><dd>{profile?.display_name ?? "—"}</dd></div>
          </dl>
        </CardContent>
      </Card>
      </div>
    </AppShell>
  );
}
