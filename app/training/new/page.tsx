import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TrainingForm } from "@/components/training/training-form";
import { createClient } from "@/lib/infra/db/supabase-server";
import { createTrainingSession } from "@/lib/usecases/training-actions";
import { getDisciplines } from "@/lib/usecases/training-actions";

export default async function NewTrainingSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const disciplines = await getDisciplines();

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold">Nouvelle séance</h1>
      <TrainingForm disciplines={disciplines} action={createTrainingSession} submitLabel="Enregistrer" />
    </AppShell>
  );
}
