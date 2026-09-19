import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic } from "@/components/championship/section-photo";
import { SearchHistory } from "@/components/search/search-history";
import { T } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/infra/db/supabase-server";
import { search, type SearchResultType } from "@/lib/usecases/search-actions";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, SEARCH_QUICK_PROMPTS } from "@/lib/i18n";

const TYPE_LABEL_KEYS: Record<SearchResultType, string> = {
  skill: "search.type.skill",
  resource: "search.type.resource",
  session: "search.type.session",
  observation: "search.type.observation",
  goal: "search.type.goal",
};
const TYPE_LABEL_FALLBACKS: Record<SearchResultType, string> = {
  skill: "Compétence",
  resource: "Ressource",
  session: "Séance",
  observation: "Observation",
  goal: "Objectif",
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
  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];
  const quickPrompts = SEARCH_QUICK_PROMPTS[locale];

  return (
    <AppShell>
      <div className="editorial-page editorial-search">
        <PageHeader page="search" title="Recherche" description={<T k="search.description" fallback="Explorez vos compétences, séances, observations, objectifs et ressources." />} />

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
              <Link key={`${r.type}-${r.id}`} href={r.href}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-start gap-3 py-3">
                    <Badge variant="outline" className="mt-0.5 shrink-0">
                      <T k={TYPE_LABEL_KEYS[r.type]} fallback={TYPE_LABEL_FALLBACKS[r.type]} />
                    </Badge>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-medium">{r.title}</span>
                      {r.detail ? <span className="truncate text-sm text-muted-foreground">{r.detail}</span> : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
