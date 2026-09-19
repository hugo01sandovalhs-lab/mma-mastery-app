import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { PHOTO_STORIES } from "@/lib/design/photography";
import type { TechniqueOfTheDay } from "@/lib/usecases/skill-actions";
import type { ResolvedDifficulty, WeeklyReviewDigest } from "@/lib/domain/review";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";

type Dict = (typeof DICTIONARIES)["fr"];

function relativeDays(iso: string, dict: Dict): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return dict["common.today"];
  if (days === 1) return dict["common.yesterday"];
  return formatT(dict["common.daysAgo"], { days });
}

export function CoachWeeklyDigest({
  locale,
  techniqueOfTheDay,
  weeklyDigest,
  lastResolved,
}: {
  locale: Locale;
  techniqueOfTheDay: TechniqueOfTheDay | null;
  weeklyDigest: WeeklyReviewDigest;
  lastResolved: ResolvedDifficulty | null;
}) {
  const dict = DICTIONARIES[locale];
  const [watchPhoto, adjustPhoto, repeatPhoto] = PHOTO_STORIES.coach;

  return (
    <div className="coach-modules">
      <div className="coach-module-card">
        <ProgressiveImage src={watchPhoto.src} alt={watchPhoto.alt} fill sizes="(max-width: 767px) 100vw, 33vw" style={{ objectFit: "cover", objectPosition: watchPhoto.position }} />
        <span className="coach-module-eyebrow">
          <Sparkles className="size-3.5" /> {dict["photoLabel.watch"]} · {dict["skills.techniqueOfDay"]}
        </span>
        {techniqueOfTheDay ? (
          <>
            <p className="text-sm font-semibold">{techniqueOfTheDay.name}</p>
            <p className="text-xs opacity-80">{techniqueOfTheDay.disciplineName}</p>
            <Button variant="outline" size="sm" render={<Link href={`/skills/${techniqueOfTheDay.id}`} />} className="mt-1 w-fit">
              {dict["coach.techniqueOfDay.cta"]} <ArrowRight />
            </Button>
          </>
        ) : (
          <p className="text-sm opacity-80">{dict["coach.techniqueOfDay.empty"]}</p>
        )}
      </div>

      <div className="coach-module-card">
        <ProgressiveImage src={adjustPhoto.src} alt={adjustPhoto.alt} fill sizes="(max-width: 767px) 100vw, 33vw" style={{ objectFit: "cover", objectPosition: adjustPhoto.position }} />
        <span className="coach-module-eyebrow">
          <CalendarClock className="size-3.5" /> {dict["photoLabel.adjust"]} · {dict["skills.reviewThisWeek"]}
        </span>
        {weeklyDigest.skillsTouchedCount === 0 && weeklyDigest.questionCount === 0 && weeklyDigest.difficultyCount === 0 ? (
          <p className="text-sm opacity-80">{dict["coach.weeklyReview.empty"]}</p>
        ) : (
          <p className="text-sm">
            {formatT(dict["coach.weeklyReview.summary"], {
              skills: weeklyDigest.skillsTouchedCount,
              difficulties: weeklyDigest.difficultyCount,
              questions: weeklyDigest.questionCount,
            })}
          </p>
        )}
      </div>

      <div className="coach-module-card">
        <ProgressiveImage src={repeatPhoto.src} alt={repeatPhoto.alt} fill sizes="(max-width: 767px) 100vw, 33vw" style={{ objectFit: "cover", objectPosition: repeatPhoto.position }} />
        <span className="coach-module-eyebrow">
          <CheckCircle2 className="size-3.5" /> {dict["photoLabel.repeat"]} · {dict["skills.lastResolved"]}
        </span>
        {lastResolved ? (
          <>
            <p className="text-sm">
              {formatT(dict["coach.lastResolved.summary"], {
                skill: lastResolved.skillName,
                content: String(lastResolved.detailVars.content ?? ""),
                when: relativeDays(lastResolved.occurredAt, dict),
              })}
            </p>
            <Badge variant="outline" className="w-fit text-[0.65rem]">
              {lastResolved.skillName}
            </Badge>
          </>
        ) : (
          <p className="text-sm opacity-80">{dict["coach.lastResolved.empty"]}</p>
        )}
      </div>
    </div>
  );
}
