import { Dumbbell, Flame, MessageCircleQuestion, Target, Zap } from "lucide-react";
import type { TrainingPlanActionType } from "@/lib/domain/training-intelligence";

export const ACTION_TYPE_LABELS: Record<TrainingPlanActionType, string> = {
  REVIEW: "À clarifier",
  DRILL: "Drilling",
  LIVE_APPLICATION: "Application live",
  SPARRING_FOCUS: "Focus sparring",
  REINFORCE: "À raviver",
};

export const ACTION_TYPE_ICONS: Record<TrainingPlanActionType, typeof Dumbbell> = {
  REVIEW: MessageCircleQuestion,
  DRILL: Dumbbell,
  LIVE_APPLICATION: Zap,
  SPARRING_FOCUS: Flame,
  REINFORCE: Target,
};
