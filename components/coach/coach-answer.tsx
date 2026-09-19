"use client";

import type { ReactNode } from "react";
import { ArrowRight, Sparkles, Video } from "lucide-react";
import Link from "next/link";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CoachAnswer } from "@/lib/usecases/ai-coach-actions";
import { useI18n } from "@/components/i18n-provider";

const FACT_KIND_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  OBSERVED: "secondary",
  INFERRED: "default",
  HYPOTHESIS: "outline",
};

export function CoachAnswerView({
  answer,
  videoSlot,
}: {
  answer: CoachAnswer;
  /** Streamed in separately (e.g. behind Suspense) so the external YouTube lookup never blocks the rest of the answer. Falls back to answer.videos when omitted. */
  videoSlot?: ReactNode;
}) {
  const { t } = useI18n();
  const { context, response, providerName, videos, videoSuggestions } = answer;

  if (response.status === "insufficient_data") {
    return (
      <Card>
        <CardContent className="editorial-empty flex flex-col items-start gap-2 py-8">
          <Sparkles className="size-6 text-muted-foreground" />
          <p className="font-medium">{t("coach.notEnoughDataTitle", "Pas encore assez de données")}</p>
          <p className="max-w-md text-sm text-muted-foreground">{response.reason}</p>
          <Button variant="outline" size="sm" render={<Link href="/training/new" />} className="mt-1">
            {t("coach.logSession", "Enregistrer une séance")} <ArrowRight />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const primaryVideoQuery = videoSuggestions[0] ?? "mma technique";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t("coach.responseLabel", "Réponse du coach")}</span>
            <Badge variant="outline" className="text-[0.65rem]">
              {providerName === "deterministic-fallback"
                ? t("coach.deterministicRules", "Règles déterministes")
                : t("coach.localModel", "Modèle local · {name}", { name: providerName })}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed">{response.summary}</p>

          {response.recommendations.length > 0 ? (
            <ul className="flex flex-col gap-2 border-t border-border pt-3">
              {response.recommendations.map((rec, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <p className="flex items-start gap-1.5 text-sm">
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <span>{rec.statement}</span>
                  </p>
                  {rec.basedOnFactIndexes.length > 0 ? (
                    <p className="pl-5 text-xs text-muted-foreground">
                      {t("coach.basedOn", "Basé sur:")}{" "}
                      {rec.basedOnFactIndexes
                        .map((idx) => context.facts[idx]?.statement)
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <section aria-labelledby="coach-videos" className="coach-video-stage">
        <ProgressiveImage
          src="/mma-mastery-photos/michael-starkie--ktNaNqbomw-unsplash.jpg"
          alt="Coach tenant les paos pendant une séance"
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
          className="coach-video-stage-bg"
          style={{ objectPosition: "50% 45%" }}
        />
        <div className="coach-video-stage-shade" aria-hidden="true" />
        <div className="coach-video-heading">
          <span><Video aria-hidden="true" /> {t("coach.watchNow", "À voir maintenant")}</span>
          <h3 id="coach-videos">{t("coach.demosHeading", "Démonstrations pour votre prochain entraînement")}</h3>
          <p className="font-medium text-[#fff5e2]">{primaryVideoQuery}</p>
          {videoSuggestions.length > 1 ? (
            <ul className="grid gap-1 text-xs text-[#bcb3a4]">
              {videoSuggestions.slice(1).map((query) => <li key={query}>• {query}</li>)}
            </ul>
          ) : null}
          <Button render={<a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(primaryVideoQuery)}`} target="_blank" rel="noreferrer" />} className="w-fit">
            <Video /> {t("coach.searchYoutube", "Rechercher sur YouTube")}
          </Button>
        </div>
        {videoSlot ?? (videos.length > 0 ? (
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
        ) : null)}
      </section>

      <details className="group rounded-lg border border-border">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-muted-foreground marker:content-none">
          {t("coach.factsUsed", "Voir les {count} fait(s) utilisé(s)", { count: context.facts.length })}
        </summary>
        <ul className="flex flex-col gap-2 border-t border-border px-4 py-3">
          {context.facts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Badge variant={FACT_KIND_VARIANT[fact.kind]} className="mt-0.5 shrink-0 text-[0.65rem]">
                {t(`factKind.${fact.kind.toLowerCase()}`, fact.kind)}
              </Badge>
              <span className="text-muted-foreground">{fact.statement}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
