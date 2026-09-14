import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { MASTERY_STAGE_LABELS, SKILL_RELATION_TYPE_LABELS, computeMasteryStage } from "@/lib/domain/skill";
import { getSkill, type SkillRelationItem } from "@/lib/usecases/skill-actions";

function RelationGroup({ title, relations }: { title: string; relations: SkillRelationItem[] }) {
  if (relations.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium uppercase">{title}</h3>
      <div className="flex flex-col gap-2">
        {relations.map((r) => (
          <Link key={r.id} href={`/skills/${r.skill.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between gap-2 py-2">
                <span className="text-sm">{r.skill.name}</span>
                <Badge variant="outline">{SKILL_RELATION_TYPE_LABELS[r.relation_type]}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const skill = await getSkill(id);
  if (!skill) notFound();

  const stage = computeMasteryStage(skill.progress);

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">{skill.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{skill.discipline.name}</Badge>
          {skill.category ? <Badge variant="outline">{skill.category}</Badge> : null}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {skill.description ? (
          <Card>
            <CardContent className="text-sm whitespace-pre-wrap">{skill.description}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Progression</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{MASTERY_STAGE_LABELS[stage]}</Badge>
              <Badge variant="outline">Niveau théorique {skill.progress.knowledge_level}/5</Badge>
              <Badge variant="outline">{skill.progress.drilling_reps} reps de drilling</Badge>
              <Badge variant="outline">
                Sparring {skill.progress.sparring_success_count}/{skill.progress.sparring_attempt_count}
              </Badge>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
              <span>{skill.stats.sessionCount} séance(s) travaillée(s)</span>
              <span>{skill.stats.observationCount} observation(s) liée(s)</span>
              <span>
                Dernière pratique:{" "}
                {skill.stats.lastPracticedAt
                  ? new Date(skill.stats.lastPracticedAt).toLocaleDateString("fr-FR")
                  : "jamais"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RelationGroup
            title="Prérequis"
            relations={skill.relationsFrom.filter((r) => r.relation_type === "prerequisite")}
          />
          <RelationGroup
            title="Contres"
            relations={skill.relationsFrom.filter((r) => r.relation_type === "counter")}
          />
          <RelationGroup
            title="Variations"
            relations={skill.relationsFrom.filter((r) => r.relation_type === "variation")}
          />
          <RelationGroup
            title="Enchaînements"
            relations={skill.relationsFrom.filter((r) => r.relation_type === "follow_up")}
          />
          <RelationGroup
            title="Transitions"
            relations={skill.relationsFrom.filter((r) => r.relation_type === "transition")}
          />
          <RelationGroup
            title="Liées"
            relations={[...skill.relationsFrom, ...skill.relationsTo].filter(
              (r) => r.relation_type === "related",
            )}
          />
          <RelationGroup
            title="Compétences qui en dépendent"
            relations={skill.relationsTo.filter((r) => r.relation_type === "prerequisite")}
          />
        </div>
      </div>
    </AppShell>
  );
}
