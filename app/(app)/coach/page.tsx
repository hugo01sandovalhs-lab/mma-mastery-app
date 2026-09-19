import { redirect } from "next/navigation";
import { MessageCircleQuestion } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic, ChampionshipSectionPhoto } from "@/components/championship/section-photo";
import { CoachAnswerView } from "@/components/coach/coach-answer";
import { CoachQuestionForm } from "@/components/coach/coach-question-form";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getCoachResponse } from "@/lib/usecases/ai-coach-actions";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const answer = await getCoachResponse();

  return (
    <AppShell>
      <div className="editorial-page editorial-coach">
        <PageHeader page="coach" title={dict["page.coach.title"]} description={dict["page.coach.description"]} />

        <ChampionshipPhotoMosaic page="coach" />

        <div className="editorial-coach-columns">
        <section className="editorial-section">
          <h2>{dict["coach.analysis"]}</h2>
        <CoachAnswerView answer={answer} />
        </section>

        <section className="editorial-section">
          <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["coach.ask"]}</h2>
          <CoachQuestionForm />
          <ChampionshipSectionPhoto
            src="/mma-mastery-photos/wade-austin-ellis-sf0qE4XehbI-unsplash.jpg"
            alt="Coach donnant des conseils entre deux rounds"
            label="Conseils entre les rounds"
            labelKey="photoLabel.roundAdvice"
            icon={MessageCircleQuestion}
            objectPosition="42% 42%"
          />
        </section>
        </div>
      </div>
    </AppShell>
  );
}
