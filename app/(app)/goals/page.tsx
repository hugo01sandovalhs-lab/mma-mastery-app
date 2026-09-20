import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getGoals } from "@/lib/usecases/goals-actions";
import { getSkills } from "@/lib/usecases/skill-actions";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalRow } from "@/components/goals/goal-row";
import { ChampionshipPhotoMosaic } from "@/components/championship/section-photo";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const [goals, skills] = await Promise.all([getGoals(), getSkills().catch(() => [])]);

  return (
    <AppShell>
      <div className="editorial-page editorial-goals">
        <PageHeader page="goals" title={dict["page.goals.title"]} description={dict["page.goals.description"]} />

        <ChampionshipPhotoMosaic page="goals" />

        <div className="editorial-secondary-columns">
        <section className="editorial-section">
        <h2>{dict["goals.defineGoal"]}</h2>
        <GoalForm skills={skills} />
        </section>

        <section className="editorial-section">
        <h2>{dict["goals.roadmap"]}</h2>
        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              {dict["goals.noneYet"]}
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
