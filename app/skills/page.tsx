import Link from "next/link";
import { redirect } from "next/navigation";
import { Network, Search, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getDisciplines } from "@/lib/usecases/training-actions";
import { getSkills, type SkillListItem } from "@/lib/usecases/skill-actions";
import { MASTERY_STAGE_LABELS, type MasteryStage } from "@/lib/domain/skill";

const STAGE_BADGE_VARIANT: Record<MasteryStage, "default" | "secondary" | "outline"> = {
  unknown: "outline",
  introduced: "secondary",
  drilling: "secondary",
  applying: "secondary",
  consistent: "default",
  mastered: "default",
};

function relativeDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "il y a 1 jour";
  return `il y a ${days} jours`;
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; discipline?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { q, discipline } = await searchParams;
  const [disciplines, skills] = await Promise.all([
    getDisciplines(),
    getSkills({ disciplineId: discipline || undefined, search: q || undefined }),
  ]);

  const isFiltered = Boolean(q || discipline);
  const trackedCount = skills.filter((s) => s.stage !== "unknown").length;

  const groups = new Map<string, { name: string; items: SkillListItem[] }>();
  for (const s of skills) {
    const g = groups.get(s.discipline.id) ?? { name: s.discipline.name, items: [] };
    g.items.push(s);
    groups.set(s.discipline.id, g);
  }
  const sortedGroups = Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Compétences
            </h1>
            <p className="text-sm text-muted-foreground">
              {skills.length} compétence{skills.length > 1 ? "s" : ""} au catalogue
              {trackedCount > 0
                ? ` · ${trackedCount} suivie${trackedCount > 1 ? "s" : ""}`
                : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/skills/map" />} className="w-fit">
            <Network /> Carte de maîtrise
          </Button>
        </div>

        <form className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Rechercher une compétence..."
              defaultValue={q ?? ""}
              className="pl-8"
            />
          </div>
          <Select
            name="discipline"
            defaultValue={discipline ?? ""}
            items={[
              { value: "", label: "Toutes les disciplines" },
              ...disciplines.map((d) => ({ value: d.id, label: d.name })),
            ]}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les disciplines</SelectItem>
              {disciplines.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">
            Filtrer
          </Button>
        </form>

        {skills.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-2 py-8">
              <Target className="size-6 text-muted-foreground" />
              <p className="font-medium">
                {isFiltered ? "Aucune compétence ne correspond" : "Aucune compétence au catalogue"}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {isFiltered
                  ? "Essayez une autre recherche ou une autre discipline."
                  : "Le catalogue de compétences se remplit au fil de vos séances et de son administration."}
              </p>
              {isFiltered ? (
                <Button variant="outline" size="sm" render={<Link href="/skills" />} className="mt-1">
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {sortedGroups.map((g) => (
              <section key={g.name} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-muted-foreground">{g.name}</h2>
                  <span className="text-xs text-muted-foreground/70">{g.items.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {g.items.map((s) => (
                    <SkillCard key={s.id} skill={s} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SkillCard({ skill }: { skill: SkillListItem }) {
  return (
    <Link href={`/skills/${skill.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium leading-snug">{skill.name}</span>
            <Badge variant={STAGE_BADGE_VARIANT[skill.stage]} className="shrink-0">
              {MASTERY_STAGE_LABELS[skill.stage]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {skill.category ? <Badge variant="outline">{skill.category}</Badge> : null}
            {skill.lastPracticedAt ? (
              <span className="text-xs text-muted-foreground">
                Pratiqué {relativeDays(skill.lastPracticedAt)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
