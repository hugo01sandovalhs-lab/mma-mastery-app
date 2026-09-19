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
import { createClient } from "@/lib/infra/db/supabase-server";
import { getCoachResponseText, getCoachVideos, type CoachAnswer } from "@/lib/usecases/ai-coach-actions";
import type { VideoSearchQuery } from "@/lib/domain/video-search";
import { getLastResolvedDifficulty, getWeeklyReviewDigest } from "@/lib/usecases/review-actions";
import { getTechniqueOfTheDay } from "@/lib/usecases/skill-actions";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";

/** Fetches the external YouTube results on its own so Suspense can stream them in after the rest of the coach answer has rendered. */
async function CoachVideoGrid({ videoQuery }: { videoQuery: VideoSearchQuery }) {
  const videos = await getCoachVideos(videoQuery);
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

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const [answerText, techniqueOfTheDay, weeklyDigest, lastResolved] = await Promise.all([
    getCoachResponseText(),
    getTechniqueOfTheDay(),
    getWeeklyReviewDigest(),
    getLastResolvedDifficulty(),
  ]);
  const answer: CoachAnswer = { ...answerText, videos: [] };

  return (
    <AppShell>
      <div className="editorial-page editorial-coach">
        <PageHeader page="coach" title={dict["page.coach.title"]} description={dict["page.coach.description"]} />

        <CoachWeeklyDigest
          locale={locale}
          techniqueOfTheDay={techniqueOfTheDay}
          weeklyDigest={weeklyDigest}
          lastResolved={lastResolved}
        />

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
          <CoachQuestionForm />
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
