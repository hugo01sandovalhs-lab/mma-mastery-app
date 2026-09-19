import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" /> {dict["skills.techniqueOfDay"]}
          </span>
          {techniqueOfTheDay ? (
            <>
              <p className="text-sm font-semibold">{techniqueOfTheDay.name}</p>
              <p className="text-xs text-muted-foreground">{techniqueOfTheDay.disciplineName}</p>
              <Button variant="outline" size="sm" render={<Link href={`/skills/${techniqueOfTheDay.id}`} />} className="mt-1 w-fit">
                {dict["coach.techniqueOfDay.cta"]} <ArrowRight />
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{dict["coach.techniqueOfDay.empty"]}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CalendarClock className="size-3.5" /> {dict["skills.reviewThisWeek"]}
          </span>
          {weeklyDigest.skillsTouchedCount === 0 && weeklyDigest.questionCount === 0 && weeklyDigest.difficultyCount === 0 ? (
            <p className="text-sm text-muted-foreground">{dict["coach.weeklyReview.empty"]}</p>
          ) : (
            <p className="text-sm">
              {formatT(dict["coach.weeklyReview.summary"], {
                skills: weeklyDigest.skillsTouchedCount,
                difficulties: weeklyDigest.difficultyCount,
                questions: weeklyDigest.questionCount,
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="size-3.5" /> {dict["skills.lastResolved"]}
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
            <p className="text-sm text-muted-foreground">{dict["coach.lastResolved.empty"]}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
