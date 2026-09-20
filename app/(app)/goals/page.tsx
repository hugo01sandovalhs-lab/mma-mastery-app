import { redirect } from "next/navigation";
import { TargetIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getGoals } from "@/lib/usecases/goals-actions";
import { getSkills } from "@/lib/usecases/skill-actions";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalRow } from "@/components/goals/goal-row";
import { PHOTO_STORIES } from "@/lib/design/photography";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";

const [CAP_PHOTO, PROGRESSION_PHOTO] = PHOTO_STORIES.goals;

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

        <div className="editorial-secondary-columns">
        <section className="editorial-photo-module">
        <ProgressiveImage
          src={CAP_PHOTO.src}
          alt={CAP_PHOTO.alt}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: "cover", objectPosition: CAP_PHOTO.position }}
        />
        <h2>{dict["goals.defineGoal"]}</h2>
        <div className="goals-photo-panel">
          <GoalForm skills={skills} />
        </div>
        </section>

        <section className="editorial-photo-module">
        <ProgressiveImage
          src={PROGRESSION_PHOTO.src}
          alt={PROGRESSION_PHOTO.alt}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: "cover", objectPosition: PROGRESSION_PHOTO.position }}
        />
        <h2>{dict["goals.roadmap"]}</h2>
        {goals.length === 0 ? (
          <div className="goals-photo-panel goals-empty-panel">
            <TargetIcon aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{dict["goals.noneYet"]}</p>
          </div>
        ) : (
          <div className="goals-photo-panel flex flex-col gap-2">
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
