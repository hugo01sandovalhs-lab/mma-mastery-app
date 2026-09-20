import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MessageCircleQuestion } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipSectionPhoto } from "@/components/championship/section-photo";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { CoachAnswerView } from "@/components/coach/coach-answer";
import { CoachQuestionForm } from "@/components/coach/coach-question-form";
import { CoachWeeklyDigest } from "@/components/coach/coach-weekly-digest";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getCoachResponseText, getCoachVideos, type CoachAnswer } from "@/lib/usecases/ai-coach-actions";
import type { VideoSearchQuery } from "@/lib/domain/video-search";
import { searchTechniqueVideos } from "@/lib/usecases/video-search-actions";
import { getLastResolvedDifficulty, getWeeklyReviewDigest } from "@/lib/usecases/review-actions";
import { getTechniqueOfTheDay, type TechniqueOfTheDay } from "@/lib/usecases/skill-actions";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, type Locale } from "@/lib/i18n";

/** Small, separately-streamed 1-2 video slot for today's technique — the external YouTube lookup never blocks the rest of the digest. */
async function TechniqueOfDayVideos({ technique, discipline }: { technique: string; discipline: string }) {
  const videos = (await searchTechniqueVideos({ technique, discipline, difficulty: "" }).catch(() => [])).slice(0, 2);
  if (videos.length === 0) return null;
  return (
    <div className="coach-module-videos mt-1 flex flex-col gap-1.5">
      {videos.map((video) => (
        <a key={video.videoId} href={video.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs hover:underline">
          <ProgressiveImage src={video.thumbnail} alt="" width={64} height={36} className="aspect-video w-16 shrink-0 rounded object-cover" />
          <span className="line-clamp-2">{video.title}</span>
        </a>
      ))}
    </div>
  );
}

/** The 3-card weekly digest is supplementary context, not the page's core purpose (the coach answer below it) — streamed independently so it never blocks first paint. */
async function CoachWeeklyDigestSection({ locale }: { locale: Locale }) {
  // A rejection here (catalog/DB blip) is a temporary-unavailable state, never
  // the same "no skills" empty state the UI shows when the pick genuinely
  // found nothing — conflating the two used to render "Catalogue vide" for a
  // transient failure even though the catalog itself has 133 skills.
  const [techniqueOfDayResult, weeklyDigest, lastResolved] = await Promise.all([
    getTechniqueOfTheDay().then(
      (value): { value: TechniqueOfTheDay | null; failed: boolean } => ({ value, failed: false }),
    ).catch(() => ({ value: null, failed: true })),
    getWeeklyReviewDigest().catch(() => ({ skillsTouchedCount: 0, questionCount: 0, difficultyCount: 0 })),
    getLastResolvedDifficulty().catch(() => null),
  ]);
  const { value: techniqueOfTheDay, failed: techniqueOfDayFailed } = techniqueOfDayResult;
  return (
    <CoachWeeklyDigest
      locale={locale}
      techniqueOfTheDay={techniqueOfTheDay}
      techniqueOfDayFailed={techniqueOfDayFailed}
      videoSlot={
        techniqueOfTheDay ? (
          <Suspense fallback={null}>
            <TechniqueOfDayVideos technique={techniqueOfTheDay.name} discipline={techniqueOfTheDay.disciplineName} />
          </Suspense>
        ) : null
      }
      weeklyDigest={weeklyDigest}
      lastResolved={lastResolved}
    />
  );
}

function CoachWeeklyDigestSkeleton() {
  return (
    <div className="coach-modules">
      <Skeleton className="h-[300px] w-full rounded-md" />
      <Skeleton className="h-[300px] w-full rounded-md" />
      <Skeleton className="h-[300px] w-full rounded-md" />
    </div>
  );
}

/** Fetches the external YouTube results on its own so Suspense can stream them in after the rest of the coach answer has rendered. */
async function CoachVideoGrid({ videoQuery }: { videoQuery: VideoSearchQuery }) {
  const videos = await getCoachVideos(videoQuery).catch(() => []);
  if (videos.length === 0) return null;
  return (
    <div className="coach-video-grid">
      {videos.map((video) => (
        <a key={video.videoId} href={video.url} target="_blank" rel="noreferrer" className="coach-video-card group">
          <ProgressiveImage src={video.thumbnail} alt="" width={640} height={360} sizes="(max-width: 767px) 100vw, 33vw" className="aspect-video w-full object-cover" />
          <span className="grid gap-1 p-3">
            <strong className="line-clamp-2 text-sm group-hover:underline">{video.title}</strong>
            <span className="text-xs text-muted-foreground">{video.channelTitle}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export default async function CoachPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const answerText = await getCoachResponseText();
  const answer: CoachAnswer = { ...answerText, videos: [] };

  return (
    <AppShell>
      <div className="editorial-page editorial-coach">
        <PageHeader page="coach" title={dict["page.coach.title"]} description={dict["page.coach.description"]} />

        <Suspense fallback={<CoachWeeklyDigestSkeleton />}>
          <CoachWeeklyDigestSection locale={locale} />
        </Suspense>

        <div className="editorial-coach-columns">
        <section className="editorial-section">
          <h2>{dict["coach.analysis"]}</h2>
        <CoachAnswerView
          answer={answer}
          videoSlot={
            answerText.response.status === "ok" ? (
              <Suspense fallback={null}>
                <CoachVideoGrid videoQuery={answerText.videoQuery} />
              </Suspense>
            ) : null
          }
        />
        </section>

        <section className="editorial-section">
          <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["coach.ask"]}</h2>
          <CoachQuestionForm initialQuestion={q} />
          <ChampionshipSectionPhoto
            src="/mma-mastery-photos/wade-austin-ellis-sf0qE4XehbI-unsplash.jpg"
            alt="Coach donnant des conseils entre deux rounds"
            label="Conseils entre les rounds"
            labelKey="photoLabel.roundAdvice"
            icon={<MessageCircleQuestion className="size-4 shrink-0 text-primary" aria-hidden="true" />}
            objectPosition="42% 42%"
          />
        </section>
        </div>
      </div>
    </AppShell>
  );
}
