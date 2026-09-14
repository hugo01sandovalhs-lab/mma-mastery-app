import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TrainingForm } from "@/components/training/training-form";
import { createClient } from "@/lib/infra/db/supabase-server";
import { createTrainingSession, getDisciplines } from "@/lib/usecases/training-actions";
import { getSkills } from "@/lib/usecases/skill-actions";

export default async function NewTrainingSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [disciplines, skills] = await Promise.all([getDisciplines(), getSkills()]);

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold">Nouvelle séance</h1>
      <TrainingForm
        disciplines={disciplines}
        skills={skills}
        action={createTrainingSession}
        submitLabel="Enregistrer"
      />
    </AppShell>
  );
}
