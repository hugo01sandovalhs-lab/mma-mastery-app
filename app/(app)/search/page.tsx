import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircleQuestion, Video } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic } from "@/components/championship/section-photo";
import { SearchHistory } from "@/components/search/search-history";
import { T } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SkillQuickActions } from "@/components/skills/skill-quick-actions";
import { createClient } from "@/lib/infra/db/supabase-server";
import { search, type SearchResult, type SearchResultType } from "@/lib/usecases/search-actions";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, SEARCH_QUICK_PROMPTS } from "@/lib/i18n";

const TYPE_LABEL_KEYS: Record<SearchResultType, string> = {
  navigation: "search.type.navigation",
  coach: "search.type.coach",
  skill: "search.type.skill",
  resource: "search.type.resource",
  session: "search.type.session",
  observation: "search.type.observation",
  goal: "search.type.goal",
  video: "search.type.video",
};
const TYPE_LABEL_FALLBACKS: Record<SearchResultType, string> = {
  navigation: "Aller à",
  coach: "Coach",
  skill: "Compétence",
  resource: "Ressource",
  session: "Séance",
  observation: "Observation",
  goal: "Objectif",
  video: "Vidéo",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { q } = await searchParams;
  const query = q ?? "";
  const results = query ? await search(query) : [];

  // Single, unambiguous destination: skip the results list and go straight
  // there (P0 "Search as app navigator" — pressing Enter/Search should feel
  // like Spotlight, not like reviewing a results page, when there's only one
  // sensible place to land).
  if (query.trim().length >= 2 && results.length === 1 && results[0].type === "navigation") {
    redirect(results[0].href);
  }

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];
  const quickPrompts = SEARCH_QUICK_PROMPTS[locale];

  return (
    <AppShell>
      <div className="editorial-page editorial-search">
        <PageHeader page="search" title={dict["page.search.title"]} description={<T k="search.description" fallback="Explorez vos compétences, séances, observations, objectifs et ressources." />} />

        <ChampionshipPhotoMosaic page="search" />

        <section className="search-stage" aria-labelledby="search-question">
          <div>
            <p><T k="search.stageKicker" fallback="Interrogez votre parcours" /></p>
            <h2 id="search-question"><T k="search.stageQuestion" fallback="Que voulez-vous mieux maîtriser ?" /></h2>
          </div>
          <form className="search-form">
            <Input name="q" aria-label={dict["search.inputAria"]} defaultValue={query} placeholder={dict["search.placeholder"]} autoFocus />
            <Button type="submit"><T k="search.submit" fallback="Rechercher" /></Button>
          </form>
          <div className="search-prompts" aria-label={dict["search.suggestedLabel"]}>
            {quickPrompts.map((prompt) => <Link key={prompt} href={`/search?q=${encodeURIComponent(prompt)}`}>{prompt}</Link>)}
          </div>
        </section>

        <SearchHistory currentQuery={query} />

        {query.length > 0 && query.trim().length < 2 ? (
          <p className="text-sm text-muted-foreground"><T k="search.minChars" fallback="Entrez au moins 2 caractères." /></p>
        ) : null}

        {query.trim().length >= 2 && results.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              <T k="search.noResults" fallback={`Aucun résultat pour "${query}".`} vars={{ query }} />
            </CardContent>
          </Card>
        ) : null}

        {results.length > 0 ? (
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <SearchResultCard key={`${r.type}-${r.id}`} result={r} dict={dict} />
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function SearchResultCard({ result: r, dict }: { result: SearchResult; dict: (typeof DICTIONARIES)[keyof typeof DICTIONARIES] }) {
  const external = r.type === "video";
  const body = (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent className="flex items-start gap-3 py-3">
        {r.type === "video" ? <Video className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
        {r.type === "coach" ? <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
        <Badge variant="outline" className="mt-0.5 shrink-0">
          <T k={TYPE_LABEL_KEYS[r.type]} fallback={TYPE_LABEL_FALLBACKS[r.type]} />
        </Badge>
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">{r.title}</span>
          {r.detail ? <span className="truncate text-sm text-muted-foreground">{r.detail}</span> : null}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {external ? (
        <a href={r.href} target="_blank" rel="noreferrer">{body}</a>
      ) : (
        <Link href={r.href}>{body}</Link>
      )}
      {r.type === "skill" && r.skillId && r.skillName ? (
        <div className="flex flex-wrap items-center gap-1.5 pl-1">
          <SkillQuickActions skillId={r.skillId} skillName={r.skillName} path="/search" />
          <Button variant="ghost" size="sm" render={<Link href={`/youtube?q=${encodeURIComponent(r.skillName)}&discipline=${encodeURIComponent(r.disciplineName ?? "MMA")}`} />}>
            <Video /> {dict["search.action.watchVideos"]}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
