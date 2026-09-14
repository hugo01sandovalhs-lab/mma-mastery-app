import "server-only";
import { buildReviewQueue, type ReviewItem } from "@/lib/domain/review";
import { loadSkillIntelligenceInputs } from "@/lib/usecases/training-intelligence-actions";

/**
 * Learning/review loop data: reuses the same fetch as Training Intelligence
 * (`loadSkillIntelligenceInputs`) so no extra queries are issued.
 */
export async function getReviewQueue(): Promise<ReviewItem[]> {
  const inputs = await loadSkillIntelligenceInputs();
  if (inputs.length === 0) return [];
  return buildReviewQueue(inputs);
}
