import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
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
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h1 className="font-heading text-2xl font-semibold tracking-tight">AI Coach</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Réponses ancrées dans tes données réelles — sessions, progression, review. Aucune
          performance n&apos;est inventée.
        </p>

        <CoachAnswerView answer={answer} />

        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Poser une question</h2>
          <CoachQuestionForm />
        </div>
      </div>
    </AppShell>
  );
}
