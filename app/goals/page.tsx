import { redirect } from "next/navigation";
import { Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getGoals } from "@/lib/usecases/goals-actions";
import { getSkills } from "@/lib/usecases/skill-actions";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalRow } from "@/components/goals/goal-row";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [goals, skills] = await Promise.all([getGoals(), getSkills()]);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-primary" />
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Objectifs</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Objectifs court, moyen et long terme, liés à vos compétences.
          </p>
        </div>

        <GoalForm skills={skills} />

        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Aucun objectif pour l&apos;instant.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {goals.map((g) => (
              <GoalRow key={g.id} goal={g} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
