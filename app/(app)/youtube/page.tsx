import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Sparkles, Video } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipSectionPhoto } from "@/components/championship/section-photo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/infra/db/supabase-server";
import { buildYouTubeSearchSuggestions } from "@/lib/domain/video-search";
import { searchTechniqueVideos } from "@/lib/usecases/video-search-actions";
import { getResources, type ResourceListItem } from "@/lib/usecases/knowledge-actions";
import { getTrainingIntelligenceBundle } from "@/lib/usecases/training-intelligence-actions";
import { YouTubeVideoCard } from "@/components/youtube/youtube-video-card";
import { YouTubeHistory } from "@/components/youtube/youtube-history";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";

const DISCIPLINES = ["MMA", "Wrestling", "BJJ", "Muay Thai", "Boxing"] as const;

function videoGridSkeleton() {
  return (
    <div className="youtube-video-grid">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="aspect-video w-full rounded-xl" />
    </div>
  );
}

/** The external YouTube search call is the slowest thing on this page — streamed independently so the header/search form appear immediately. */
async function SearchResultsSection({
  dict,
  query,
  discipline,
  favoriteIdByUrl,
}: {
  dict: (typeof DICTIONARIES)[Locale];
  query: string;
  discipline: string;
  favoriteIdByUrl: Map<string, string>;
}) {
  const results = await searchTechniqueVideos({ technique: query, discipline, difficulty: "" }).catch(() => []);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{formatT(dict["youtube.resultsFor"], { query })}</h2>
      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground">{dict["youtube.noResults"]}</p>
      ) : (
        <div className="youtube-video-grid">
          {results.map((video) => (
            <YouTubeVideoCard key={video.videoId} video={video} favoriteId={favoriteIdByUrl.get(video.url) ?? null} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Depends on the training-intelligence bundle then a second external YouTube search — the slowest chain on the page, streamed on its own. */
async function ForYouSection({
  dict,
  favoriteIdByUrl,
}: {
  dict: (typeof DICTIONARIES)[Locale];
  favoriteIdByUrl: Map<string, string>;
}) {
  const { intelligence, plan } = await getTrainingIntelligenceBundle().catch(() => ({
    intelligence: { status: "insufficient_data" as const },
    plan: { status: "insufficient_data" as const },
  }));

  const focusTechnique =
    plan.status === "ok"
      ? plan.plan.focusSkillName
      : intelligence.status === "ok"
        ? (intelligence.recommendations[0]?.skillName ?? null)
        : null;

  if (!focusTechnique) return null;

  const todayResults = await searchTechniqueVideos({ technique: focusTechnique, discipline: "MMA", difficulty: "" }).catch(() => []);
  if (todayResults.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["youtube.forYou"]}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{formatT(dict["youtube.basedOnFocus"], { technique: focusTechnique })}</p>
      <div className="youtube-video-grid">
        {todayResults.map((video) => (
          <YouTubeVideoCard key={video.videoId} video={video} favoriteId={favoriteIdByUrl.get(video.url) ?? null} />
        ))}
      </div>
    </section>
  );
}

export default async function YouTubePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; discipline?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const { q, discipline } = await searchParams;
  const query = (q ?? "").trim();
  const effectiveDiscipline = discipline || "MMA";

  const favorites: ResourceListItem[] = await getResources().catch(() => []);
  const favoriteIdByUrl = new Map(
    favorites.filter((r) => r.type === "video").map((r) => [r.url, r.id]),
  );

  const suggestions = query
    ? buildYouTubeSearchSuggestions({ technique: query, discipline: effectiveDiscipline, difficulty: "" })
    : [];

  return (
    <AppShell>
      <div className="editorial-page editorial-youtube">
        <PageHeader
          page="youtube"
          title="YouTube"
          description={dict["youtube.pageDescription"]}
        />

        <section className="search-stage" aria-labelledby="youtube-question">
          <div>
            <p>{dict["youtube.findDemo"]}</p>
            <h2 id="youtube-question">{dict["youtube.whatToWatch"]}</h2>
          </div>
          <form className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_auto]">
            <Input name="q" aria-label={dict["youtube.searchAria"]} defaultValue={query} placeholder={dict["youtube.searchPlaceholder"]} autoFocus />
            <Select name="discipline" defaultValue={effectiveDiscipline} items={DISCIPLINES.map((d) => ({ value: d, label: d }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={dict["youtube.disciplinePlaceholder"]} />
              </SelectTrigger>
              <SelectContent>
                {DISCIPLINES.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">{dict["search.submit"]}</Button>
          </form>
          {suggestions.length > 0 ? (
            <div className="search-prompts" aria-label={dict["youtube.suggested"]}>
              {suggestions.map((s) => (
                <Link key={s} href={`/youtube?q=${encodeURIComponent(s)}&discipline=${encodeURIComponent(effectiveDiscipline)}`}>{s}</Link>
              ))}
            </div>
          ) : null}
          <YouTubeHistory currentQuery={query} />
        </section>

        {query ? (
          <Suspense fallback={videoGridSkeleton()}>
            <SearchResultsSection dict={dict} query={query} discipline={effectiveDiscipline} favoriteIdByUrl={favoriteIdByUrl} />
          </Suspense>
        ) : null}

        <Suspense fallback={null}>
          <ForYouSection dict={dict} favoriteIdByUrl={favoriteIdByUrl} />
        </Suspense>

        <ChampionshipSectionPhoto
          src="/mma-mastery-photos/ahmad-thomas-ulFi8aO6Xdk-unsplash.jpg"
          alt="Travail au pao en Muay Thai"
          label="Techniques et drills"
          labelKey="photoLabel.drills"
          icon={<Video className="size-4 shrink-0 text-primary" aria-hidden="true" />}
          objectPosition="45% 50%"
        />

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["youtube.byDiscipline"]}</h2>
          <div className="search-prompts">
            {DISCIPLINES.map((d) => (
              <Link key={d} href={`/youtube?q=${encodeURIComponent(d)}&discipline=${encodeURIComponent(d)}`}>{d}</Link>
            ))}
          </div>
        </section>

        <ChampionshipSectionPhoto
          src="/mma-mastery-photos/anastase-maragos-mDSGxpSugsE-unsplash.jpg"
          alt="Coin de coachs assistant un combattant"
          label="Coachs & partenaires"
          labelKey="photoLabel.coachesPartners"
          icon={<Sparkles className="size-4 shrink-0 text-primary" aria-hidden="true" />}
          objectPosition="45% 38%"
        />

        <Link href="/youtube?q=Grappling&discipline=BJJ">
          <ChampionshipSectionPhoto
            src="/mma-mastery-photos/yousef-samuil-CH_NdLJIa7Y-unsplash.jpg"
            alt="Projection en grappling lors d'un combat"
            label="Grappling & lutte"
            labelKey="photoLabel.grapplingWrestling"
            icon={<Video className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            objectPosition="50% 62%"
          />
        </Link>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["youtube.favorites"]}</h2>
          {favorites.filter((r) => r.type === "video").length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict["youtube.noFavorites"]}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {favorites.filter((r) => r.type === "video").map((r) => (
                <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="youtube-favorite-row">
                  <strong>{r.title}</strong>
                  {r.author ? <span>{r.author}</span> : null}
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
