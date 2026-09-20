import Link from "next/link";
import { redirect } from "next/navigation";
import { Network, Search, Swords, Target, Waypoints } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { T } from "@/components/i18n-provider";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic, ChampionshipSectionPhoto } from "@/components/championship/section-photo";
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
import { MASTERY_STAGE_LABEL_KEYS, type MasteryStage } from "@/lib/domain/skill";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, formatT } from "@/lib/i18n";

function relativeDays(iso: string, dict: (typeof DICTIONARIES)["fr"]): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return dict["common.today"];
  if (days === 1) return dict["common.yesterday"];
  return formatT(dict["common.daysAgo"], { days });
}

const STAGE_BADGE_VARIANT: Record<MasteryStage, "default" | "secondary" | "outline"> = {
  unknown: "outline",
  introduced: "secondary",
  drilling: "secondary",
  applying: "secondary",
  consistent: "default",
  mastered: "default",
};

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
  let catalogLoadError = false;
  const [disciplines, skills, locale] = await Promise.all([
    getDisciplines().catch(() => []),
    getSkills({ disciplineId: discipline || undefined, search: q || undefined }).catch((error) => {
      console.error(error);
      catalogLoadError = true;
      return [] as SkillListItem[];
    }),
    getServerLocale(),
  ]);
  const dict = DICTIONARIES[locale];

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
      <div className="editorial-page editorial-skills">
        <PageHeader page="skills" title={dict["page.skills.title"]} description={<>
            <p><T k="skills.catalogueTagline" fallback="Comprendre le geste. Affiner la maîtrise." /></p>
            <p className="editorial-caption">
              <T k="skills.catalogueCount" fallback="{count} compétence(s) au catalogue" vars={{ count: skills.length }} />
              {trackedCount > 0 ? (
                <>
                  {" · "}
                  <T k="skills.trackedCount" fallback="{count} suivie(s)" vars={{ count: trackedCount }} />
                </>
              ) : null}
            </p>
          </>} actions={
          <Button variant="outline" size="sm" render={<Link href="/skills/map" />} className="w-fit">
            <Network /> <T k="skills.masteryMap" fallback="Carte de maîtrise" />
          </Button>
        } />

        <ChampionshipPhotoMosaic page="skills" />

        <div className="editorial-secondary-columns">
          <ChampionshipSectionPhoto
            src="/mma-mastery-photos/pexels-duren-williams-29414623-11392335.jpg"
            alt="Deux pratiquantes en situation de sparring au sol"
            label="Sparring"
            labelKey="photoLabel.sparring"
            icon={<Swords className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            objectPosition="45% 55%"
          />
          <ChampionshipSectionPhoto
            src="/mma-mastery-photos/pexels-stephanie-crephead-130171264-11201261.jpg"
            alt="Projection de judo sur tapis en extérieur"
            label="Projections"
            labelKey="photoLabel.takedown"
            icon={<Waypoints className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            objectPosition="35% 65%"
          />
        </div>

        <form className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              aria-label={dict["skills.searchAria"]}
              placeholder={dict["skills.searchPlaceholder"]}
              defaultValue={q ?? ""}
              className="pl-8"
            />
          </div>
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
          <Button type="submit" variant="outline">
            <T k="action.filter" fallback="Filtrer" />
          </Button>
        </form>

        {catalogLoadError ? (
          <Card>
            <CardContent className="editorial-empty">
              <Target className="size-6 text-muted-foreground" />
              <p className="font-medium">
                <T k="skills.catalogueLoadError" fallback="Le catalogue n'a pas pu être chargé" />
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                <T k="skills.catalogueLoadErrorDesc" fallback="Problème temporaire de connexion. Réessayez dans un instant." />
              </p>
              <Button variant="outline" size="sm" render={<Link href="/skills" />} className="mt-1">
                <T k="offline.cta" fallback="Réessayer" />
              </Button>
            </CardContent>
          </Card>
        ) : skills.length === 0 ? (
          <Card>
            <CardContent className="editorial-empty">
              <Target className="size-6 text-muted-foreground" />
              <p className="font-medium">
                {isFiltered ? <T k="skills.noneMatch" fallback="Aucune compétence ne correspond" /> : <T k="skills.noneInCatalogue" fallback="Aucune compétence au catalogue" />}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {isFiltered ? (
                  <T k="skills.tryOtherSearch" fallback="Essayez une autre recherche ou une autre discipline." />
                ) : (
                  <T k="skills.catalogueGrows" fallback="Le catalogue de compétences se remplit au fil de vos séances et de son administration." />
                )}
              </p>
              {isFiltered ? (
                <Button variant="outline" size="sm" render={<Link href="/skills" />} className="mt-1">
                  <T k="action.resetFilters" fallback="Réinitialiser les filtres" />
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
                    <SkillCard key={s.id} skill={s} dict={dict} />
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

function SkillCard({ skill, dict }: { skill: SkillListItem; dict: (typeof DICTIONARIES)["fr"] }) {
  return (
    <Link href={`/skills/${skill.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium leading-snug">{skill.name}</span>
            <Badge variant={STAGE_BADGE_VARIANT[skill.stage]} className="shrink-0">
              {dict[MASTERY_STAGE_LABEL_KEYS[skill.stage]]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {skill.category ? <Badge variant="outline">{skill.category}</Badge> : null}
            {skill.lastPracticedAt ? (
              <span className="text-xs text-muted-foreground">
                {formatT(dict["skills.practicedAgo"], { when: relativeDays(skill.lastPracticedAt, dict) })}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
