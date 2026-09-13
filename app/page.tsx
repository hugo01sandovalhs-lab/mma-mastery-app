import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/infra/db/supabase-server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">MMA Mastery</h1>
      <p className="text-muted-foreground mt-2">
        {user
          ? `Connecté en tant que ${user.email}.`
          : "Créez un compte pour suivre votre entraînement."}
      </p>
    </AppShell>
  );
}
