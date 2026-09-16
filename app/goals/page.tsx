import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
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
      <div className="editorial-page editorial-goals">
        <PageHeader page="goals" title="Objectifs" description="Donner une direction à l'effort. Vos objectifs à court, moyen et long terme, liés à vos compétences." />

        <div className="editorial-secondary-columns">
        <section className="editorial-section">
        <h2>Définir un objectif</h2>
        <GoalForm skills={skills} />
        </section>

        <section className="editorial-section">
        <h2>Votre feuille de route</h2>
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
        </section>
        </div>
      </div>
    </AppShell>
  );
}
