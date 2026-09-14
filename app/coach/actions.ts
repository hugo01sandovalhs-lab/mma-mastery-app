"use server";

import { getCoachResponse, type CoachAnswer } from "@/lib/usecases/ai-coach-actions";

export async function askCoachAction(question: string): Promise<CoachAnswer> {
  const trimmed = question.trim();
  return getCoachResponse(trimmed.length > 0 ? trimmed : undefined);
}
