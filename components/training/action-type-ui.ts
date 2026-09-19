import { Dumbbell, Flame, MessageCircleQuestion, Target, Zap } from "lucide-react";
import type { TrainingPlanActionType } from "@/lib/domain/training-intelligence";

/** i18n dictionary key for each action type — look up via `dict[ACTION_TYPE_LABEL_KEYS[type]]`. */
export const ACTION_TYPE_LABEL_KEYS: Record<
  TrainingPlanActionType,
  "actionType.review" | "actionType.drill" | "actionType.liveApplication" | "actionType.sparringFocus" | "actionType.reinforce"
> = {
  REVIEW: "actionType.review",
  DRILL: "actionType.drill",
  LIVE_APPLICATION: "actionType.liveApplication",
  SPARRING_FOCUS: "actionType.sparringFocus",
  REINFORCE: "actionType.reinforce",
};

export const ACTION_TYPE_ICONS: Record<TrainingPlanActionType, typeof Dumbbell> = {
  REVIEW: MessageCircleQuestion,
  DRILL: Dumbbell,
  LIVE_APPLICATION: Zap,
  SPARRING_FOCUS: Flame,
  REINFORCE: Target,
};
