import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TrainingForm } from "@/components/training/training-form";
import { ACTION_TYPE_ICONS, ACTION_TYPE_LABELS } from "@/components/training/action-type-ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import type { TrainingPlanSuggestion } from "@/lib/domain/training-intelligence";
import { createTrainingSession, getDisciplines } from "@/lib/usecases/training-actions";
import { getSkills } from "@/lib/usecases/skill-actions";
import { getTrainingPlan } from "@/lib/usecases/training-intelligence-actions";

export default async function NewTrainingSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [disciplines, skills, plan] = await Promise.all([
    getDisciplines(),
    getSkills(),
    getTrainingPlan(),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Nouvelle séance
          </h1>
          <p className="text-sm text-muted-foreground">
            Enregistrez votre séance pour alimenter votre progression.
          </p>
        </div>

        {plan.status === "ok" ? <FocusCallout plan={plan.plan} /> : null}

        <TrainingForm
          disciplines={disciplines}
          skills={skills}
          action={createTrainingSession}
          submitLabel="Enregistrer"
        />
      </div>
    </AppShell>
  );
}

function FocusCallout({ plan }: { plan: TrainingPlanSuggestion }) {
  const Icon = ACTION_TYPE_ICONS[plan.actionType];
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <CardContent className="flex flex-col gap-2 pl-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Focus recommandé pour cette séance
          </span>
          <Badge variant="default" className="flex items-center gap-1.5">
            <Icon className="size-3.5" />
            {ACTION_TYPE_LABELS[plan.actionType]}
          </Badge>
        </div>
        <Link href={`/skills/${plan.focusSkillId}`} className="font-medium hover:underline">
          {plan.focusSkillName}
        </Link>
        <p className="text-sm text-muted-foreground">{plan.objective}</p>
      </CardContent>
    </Card>
  );
}
