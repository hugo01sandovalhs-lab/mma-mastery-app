import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TrainingForm } from "@/components/training/training-form";
import { createClient } from "@/lib/infra/db/supabase-server";
import {
  getDisciplines,
  getTrainingSession,
  updateTrainingSession,
} from "@/lib/usecases/training-actions";
import { getSkills } from "@/lib/usecases/skill-actions";

export default async function EditTrainingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [session, disciplines, skills] = await Promise.all([
    getTrainingSession(id),
    getDisciplines(),
    getSkills(),
  ]);
  if (!session) notFound();

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold">Modifier la séance</h1>
      <TrainingForm
        disciplines={disciplines}
        skills={skills}
        action={updateTrainingSession.bind(null, id)}
        initialData={session}
        submitLabel="Enregistrer les modifications"
      />
    </AppShell>
  );
}
