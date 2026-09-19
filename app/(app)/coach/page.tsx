import { redirect } from "next/navigation";
import { MessageCircleQuestion } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic, ChampionshipSectionPhoto } from "@/components/championship/section-photo";
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

        <ChampionshipPhotoMosaic page="coach" />

        <div className="editorial-coach-columns">
        <section className="editorial-section">
          <h2>Votre analyse</h2>
        <CoachAnswerView answer={answer} />
        </section>

        <section className="editorial-section">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Poser une question</h2>
          <CoachQuestionForm />
          <ChampionshipSectionPhoto
            src="/mma-mastery-photos/wade-austin-ellis-sf0qE4XehbI-unsplash.jpg"
            alt="Coach donnant des conseils entre deux rounds"
            label="Conseils entre les rounds"
            icon={MessageCircleQuestion}
            objectPosition="42% 42%"
          />
        </section>
        </div>
      </div>
    </AppShell>
  );
}
