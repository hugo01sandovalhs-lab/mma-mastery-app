"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { askCoachAction } from "@/app/(app)/coach/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoachAnswerView } from "@/components/coach/coach-answer";
import type { CoachAnswer } from "@/lib/usecases/ai-coach-actions";
import { useI18n } from "@/components/i18n-provider";

async function askAction(_prev: CoachAnswer | null, formData: FormData): Promise<CoachAnswer> {
  return askCoachAction(String(formData.get("question") ?? ""));
}

/** `initialQuestion` comes from /search redirecting a coaching-question query here (e.g. `/coach?q=...`) — prefilled and auto-submitted once so the hand-off feels immediate. */
export function CoachQuestionForm({ initialQuestion }: { initialQuestion?: string }) {
  const { t } = useI18n();
  const [answer, formAction, isPending] = useActionState(askAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (initialQuestion && !autoSubmitted.current) {
      autoSubmitted.current = true;
      formRef.current?.requestSubmit();
    }
  }, [initialQuestion]);
  const SUGGESTED_QUESTIONS = [
    t("coach.suggested1", "Comment améliorer mon open guard ?"),
    t("coach.suggested2", "Quelles erreurs dois-je corriger en priorité ?"),
    t("coach.suggested3", "Comment préparer ma prochaine séance ?"),
    t("coach.suggested.today", "Sur quoi travailler aujourd'hui ?"),
    t("coach.suggested.reviewWeek", "Qu'est-ce que je dois revoir cette semaine ?"),
    t("coach.suggested.wrestling", "Montre-moi une technique de wrestling"),
    t("coach.suggested.striking", "Montre-moi une technique de percussion"),
    t("coach.suggested.struggling", "Sur quoi est-ce que je bloque en ce moment ?"),
    t("coach.suggested.videosToday", "Trouve des vidéos pour la technique du jour"),
    t("coach.suggested.nextSession", "Construis ma prochaine séance"),
  ];

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="question"
          aria-label={t("coach.askLabel", "Votre question au coach")}
          placeholder={t("coach.askPlaceholder", "Pose une question au coach...")}
          defaultValue={initialQuestion}
          className="flex-1"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending} className="sm:w-fit">
          <Send className="size-4" /> {isPending ? t("coach.askPending", "...") : t("coach.askButton", "Demander")}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <form action={formAction} key={q}>
            <input type="hidden" name="question" value={q} />
            <Button type="submit" variant="outline" size="sm" disabled={isPending}>
              {q}
            </Button>
          </form>
        ))}
      </div>

      {answer ? <CoachAnswerView answer={answer} /> : null}
    </div>
  );
}
