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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Modifier la séance
          </h1>
        </div>
        <TrainingForm
          disciplines={disciplines}
          skills={skills}
          action={updateTrainingSession.bind(null, id)}
          initialData={session}
          submitLabel="Enregistrer les modifications"
        />
      </div>
    </AppShell>
  );
}
