import type { SkillIntelligenceInput } from "./training-intelligence";

export type MyGameSection = "in_game" | "developing" | "to_work";
export type MyGameItem = {
  skillId: string;
  skillName: string;
  discipline: string;
  section: MyGameSection;
  reason: string;
};

const STALE_DAYS = 28;

export function buildMyGame(inputs: readonly SkillIntelligenceInput[], now = new Date()): MyGameItem[] {
  return inputs.flatMap<MyGameItem>((input) => {
    const p = input.progress;
    const daysSincePractice = input.lastPracticedAt
      ? Math.floor((now.getTime() - new Date(input.lastPracticedAt).getTime()) / 86_400_000)
      : null;
    const base = { skillId: input.skillId, skillName: input.skillName, discipline: input.disciplineName ?? "MMA" };

    if (p.live_application_count >= 3 || (p.sparring_attempt_count >= 3 && p.sparring_success_count >= 2)) {
      return [{ ...base, section: "in_game" as const, reason: `${p.live_application_count} applications en situation` }];
    }
    if ((p.drilling_reps >= 8 || p.knowledge_level >= 3) && p.live_application_count === 0) {
      return [{ ...base, section: "to_work" as const, reason: "Étudiée ou répétée, pas encore appliquée" }];
    }
    if (daysSincePractice !== null && daysSincePractice >= STALE_DAYS && p.evidence_count > 0) {
      return [{ ...base, section: "to_work" as const, reason: `Pas travaillée depuis ${daysSincePractice} jours` }];
    }
    if (p.evidence_count > 0 || p.knowledge_level > 0 || p.drilling_reps > 0 || input.observations.length > 0) {
      return [{ ...base, section: "developing" as const, reason: `${p.evidence_count} preuves enregistrées` }];
    }
    return [];
  });
}
