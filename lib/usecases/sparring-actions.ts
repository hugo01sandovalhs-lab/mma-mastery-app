import { createClient } from "@/lib/infra/db/supabase-server";
import { getTrainingSession, type TrainingSessionDetail } from "./training-actions";

export type SparringSessionListItem = {
  id: string;
  date: string;
  title: string | null;
  duration_minutes: number | null;
  discipline: { name: string };
  techniques: {
    technique_name: string;
    outcome: "success" | "failure" | null;
    partner_name: string | null;
    pressure_level: number | null;
    problem: string | null;
    position: string | null;
    round_seconds: number | null;
    ruleset: string | null;
  }[];
};

/** Sparring history for the current user, most recent first. RLS-scoped like every other training query. */
export async function getSparringSessions(): Promise<SparringSessionListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, date, title, duration_minutes, discipline:disciplines(name), techniques:session_techniques(technique_name, outcome, partner_name, pressure_level, problem, position, round_seconds, ruleset)",
    )
    .eq("session_type", "sparring")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SparringSessionListItem[];
}

/** Wraps `getTrainingSession`, scoped to sparring sessions only. */
export async function getSparringSession(id: string): Promise<TrainingSessionDetail | null> {
  const session = await getTrainingSession(id);
  if (!session || session.session_type !== "sparring") return null;
  return session;
}
