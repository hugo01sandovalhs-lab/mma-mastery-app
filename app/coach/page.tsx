import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { CoachAnswerView } from "@/components/coach/coach-answer";
import { CoachQuestionForm } from "@/components/coach/coach-question-form";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getCoachResponse } from "@/lib/usecases/ai-coach-actions";

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const answer = await getCoachResponse();

  return (
    <AppShell>
      <div className="editorial-page editorial-coach">
        <PageHeader page="coach" title="Coach" description="Prendre du recul. Préparer la suite. Des réponses fondées sur vos séances, votre progression et vos révisions." />

        <div className="editorial-coach-columns">
        <section className="editorial-section">
          <h2>Votre analyse</h2>
        <CoachAnswerView answer={answer} />
        </section>

        <section className="editorial-section">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Poser une question</h2>
          <CoachQuestionForm />
        </section>
        </div>
      </div>
    </AppShell>
  );
}
