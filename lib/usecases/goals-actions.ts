"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import { tServer } from "@/lib/i18n-server";
import { goalInputSchema, goalStatusSchema, type GoalHorizon, type GoalStatus } from "@/lib/domain/knowledge";

export type GoalActionState = { error: string | null };

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export type GoalListItem = {
  id: string;
  horizon: GoalHorizon;
  title: string;
  description: string | null;
  status: GoalStatus;
  due_date: string | null;
  created_at: string;
  skill: { id: string; name: string } | null;
};

export async function getGoals(): Promise<GoalListItem[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("goals")
    .select("id, horizon, title, description, status, due_date, created_at, skill:skills(id, name)")
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as GoalListItem[];
}

/**
 * Active goals due within the next 14 days, or overdue — used to surface a
 * concrete deadline signal on the dashboard and to the AI Coach, both reusing
 * this single query.
 */
export async function getUpcomingGoals(): Promise<GoalListItem[]> {
  const goals = await getGoals();
  const horizonMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return goals.filter((g) => {
    if (g.status !== "active" || !g.due_date) return false;
    return new Date(g.due_date).getTime() - now <= horizonMs;
  });
}

function parseGoalForm(formData: FormData) {
  const skillId = String(formData.get("skill_id") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  return goalInputSchema.safeParse({
    horizon: String(formData.get("horizon") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    skill_id: skillId || undefined,
    due_date: dueDate || undefined,
  });
}

export async function createGoal(
  _prevState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const parsed = parseGoalForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? (await tServer("error.invalidForm", "Formulaire invalide")) };
  }
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("goals").insert({ ...parsed.data, user_id: userId });
  if (error) return { error: error.message };
  revalidatePath("/goals");
  return { error: null };
}

export async function quickAddGoalFromSkill(skillId: string, skillTitle: string, path: string): Promise<void> {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("goals")
    .insert({ user_id: userId, horizon: "short", title: skillTitle, skill_id: skillId, status: "active" });
  if (error) throw new Error(error.message);
  revalidatePath(path);
  revalidatePath("/goals");
}

export async function updateGoalStatus(goalId: string, status: string): Promise<void> {
  const parsed = goalStatusSchema.parse(status);
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("goals").update({ status: parsed }).eq("id", goalId);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("goals").delete().eq("id", goalId);
  if (error) throw new Error(error.message);
  revalidatePath("/goals");
}
