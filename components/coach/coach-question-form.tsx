"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { askCoachAction } from "@/app/coach/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoachAnswerView } from "@/components/coach/coach-answer";
import type { CoachAnswer } from "@/lib/usecases/ai-coach-actions";

const SUGGESTED_QUESTIONS = [
  "Comment améliorer mon open guard ?",
  "Quelles erreurs dois-je corriger en priorité ?",
  "Comment préparer ma prochaine séance ?",
];

async function askAction(_prev: CoachAnswer | null, formData: FormData): Promise<CoachAnswer> {
  return askCoachAction(String(formData.get("question") ?? ""));
}

export function CoachQuestionForm() {
  const [answer, formAction, isPending] = useActionState(askAction, null);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="question"
          aria-label="Votre question au coach"
          placeholder="Pose une question au coach..."
          className="flex-1"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending} className="sm:w-fit">
          <Send className="size-4" /> {isPending ? "..." : "Demander"}
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
