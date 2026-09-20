import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Network } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/infra/db/supabase-server";
import {
  MASTERY_STAGES,
  MASTERY_STAGE_LABEL_KEYS,
  SKILL_RELATION_TYPE_LABEL_KEYS,
  type MasteryStage,
} from "@/lib/domain/skill";
import { getDisciplines } from "@/lib/usecases/training-actions";
import { getSkillMap, type SkillListItem, type SkillMapData } from "@/lib/usecases/skill-actions";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, formatT } from "@/lib/i18n";

const STAGE_BADGE_VARIANT: Record<MasteryStage, "default" | "secondary" | "outline"> = {
  unknown: "outline",
  introduced: "secondary",
  drilling: "secondary",
  applying: "secondary",
  consistent: "default",
  mastered: "default",
};

export default async function SkillMapPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { discipline } = await searchParams;
  const [disciplines, map, locale] = await Promise.all([getDisciplines(), getSkillMap(), getServerLocale()]);
  const dict = DICTIONARIES[locale];

  const skills = discipline ? map.skills.filter((s) => s.discipline.id === discipline) : map.skills;
  const skillIds = new Set(skills.map((s) => s.id));
  const skillById = new Map(map.skills.map((s) => [s.id, s]));

  const outgoingByFrom = new Map<string, SkillMapData["edges"]>();
  const incomingPrereqByTo = new Map<string, SkillMapData["edges"]>();
  for (const edge of map.edges) {
    if (!skillIds.has(edge.fromSkillId) && !skillIds.has(edge.toSkillId)) continue;
    const outList = outgoingByFrom.get(edge.fromSkillId) ?? [];
    outList.push(edge);
    outgoingByFrom.set(edge.fromSkillId, outList);
    if (edge.relationType === "prerequisite") {
      const inList = incomingPrereqByTo.get(edge.fromSkillId) ?? [];
      inList.push(edge);
      incomingPrereqByTo.set(edge.fromSkillId, inList);
    }
  }

  const columns = MASTERY_STAGES.map((stage) => ({
    stage,
    items: skills.filter((s) => s.stage === stage),
  }));

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link
          href="/skills"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> {dict["page.skills.title"]}
        </Link>

        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Network className="size-5 text-primary" />
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {dict["skills.masteryMap"]}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatT(dict["skillMap.description"], { count: skills.length })}
            </p>
          </div>

          <form className="w-full sm:w-56">
            <Select
              name="discipline"
              defaultValue={discipline ?? ""}
              items={[
                { value: "", label: dict["skills.allDisciplines"] },
                ...disciplines.map((d) => ({ value: d.id, label: d.name })),
              ]}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={dict["form.discipline"]} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{dict["skills.allDisciplines"]}</SelectItem>
                {disciplines.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </form>
        </div>

        {skills.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-2 py-8">
              <Network className="size-6 text-muted-foreground" />
              <p className="font-medium">{dict["skillMap.noSkillsForDiscipline"]}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {columns
              .filter((c) => c.items.length > 0)
              .map((c) => (
                <div key={c.stage} className="flex w-72 shrink-0 flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-muted-foreground">
                      {dict[MASTERY_STAGE_LABEL_KEYS[c.stage]]}
                    </h2>
                    <span className="text-xs text-muted-foreground/70">{c.items.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {c.items.map((s) => (
                      <SkillNode
                        key={s.id}
                        skill={s}
                        outgoing={outgoingByFrom.get(s.id) ?? []}
                        incomingPrereqCount={incomingPrereqByTo.get(s.id)?.length ?? 0}
                        skillById={skillById}
                        dict={dict}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SkillNode({
  skill,
  outgoing,
  incomingPrereqCount,
  skillById,
  dict,
}: {
  skill: SkillListItem;
  outgoing: SkillMapData["edges"];
  incomingPrereqCount: number;
  skillById: Map<string, SkillListItem>;
  dict: (typeof DICTIONARIES)["fr"];
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/skills/${skill.id}`} className="text-sm font-medium leading-snug hover:underline">
            {skill.name}
          </Link>
          <Badge variant={STAGE_BADGE_VARIANT[skill.stage]} className="shrink-0">
            {dict[MASTERY_STAGE_LABEL_KEYS[skill.stage]]}
          </Badge>
        </div>

        {incomingPrereqCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {formatT(dict["skillMap.requiredFor"], { count: incomingPrereqCount })}
          </p>
        ) : null}

        {outgoing.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {outgoing.map((edge, i) => {
              const target = skillById.get(edge.toSkillId);
              if (!target) return null;
              return (
                <Link key={i} href={`/skills/${target.id}`}>
                  <Badge variant="outline" className="text-xs">
                    {dict[SKILL_RELATION_TYPE_LABEL_KEYS[edge.relationType]]}: {target.name}
                  </Badge>
                </Link>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
