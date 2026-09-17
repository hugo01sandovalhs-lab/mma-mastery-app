import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic } from "@/components/championship/section-photo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/infra/db/supabase-server";
import { search, type SearchResultType } from "@/lib/usecases/search-actions";

const TYPE_LABELS: Record<SearchResultType, string> = {
  skill: "Compétence",
  resource: "Ressource",
  session: "Séance",
  observation: "Observation",
  goal: "Objectif",
};

const QUICK_PROMPTS = [
  "Comment faire un armbar ?",
  "Qu’est-ce que l’open guard ?",
  "Comment maîtriser le double leg ?",
  "Quelles sont les erreurs les plus courantes en jab ?",
] as const;

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

  return (
    <AppShell>
      <div className="editorial-page editorial-search">
        <PageHeader page="search" title="Recherche" description="Explorez vos compétences, séances, observations, objectifs et ressources." />

        <ChampionshipPhotoMosaic page="search" />

        <section className="search-stage" aria-labelledby="search-question">
          <div>
            <p>Interrogez votre parcours</p>
            <h2 id="search-question">Que voulez-vous mieux maîtriser ?</h2>
          </div>
          <form className="search-form">
            <Input name="q" aria-label="Rechercher dans MMA Mastery" defaultValue={query} placeholder="Comment maîtriser…" autoFocus />
            <Button type="submit">Rechercher</Button>
          </form>
          <div className="search-prompts" aria-label="Questions suggérées">
            {QUICK_PROMPTS.map((prompt) => <Link key={prompt} href={`/search?q=${encodeURIComponent(prompt)}`}>{prompt}</Link>)}
          </div>
        </section>

        {query.length > 0 && query.trim().length < 2 ? (
          <p className="text-sm text-muted-foreground">Entrez au moins 2 caractères.</p>
        ) : null}

        {query.trim().length >= 2 && results.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Aucun résultat pour &quot;{query}&quot;.
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
                      {TYPE_LABELS[r.type]}
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
