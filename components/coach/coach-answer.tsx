import { ArrowRight, Sparkles, Video } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CoachAnswer } from "@/lib/usecases/ai-coach-actions";

const FACT_KIND_LABELS: Record<string, string> = {
  OBSERVED: "Observé",
  INFERRED: "Déduit",
  HYPOTHESIS: "Hypothèse",
};

const FACT_KIND_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  OBSERVED: "secondary",
  INFERRED: "default",
  HYPOTHESIS: "outline",
};

export function CoachAnswerView({ answer }: { answer: CoachAnswer }) {
  const { context, response, providerName, videos } = answer;

  if (response.status === "insufficient_data") {
    return (
      <Card>
        <CardContent className="editorial-empty flex flex-col items-start gap-2 py-8">
          <Sparkles className="size-6 text-muted-foreground" />
          <p className="font-medium">Pas encore assez de données</p>
          <p className="max-w-md text-sm text-muted-foreground">{response.reason}</p>
          <Button variant="outline" size="sm" render={<Link href="/training/new" />} className="mt-1">
            Enregistrer une séance <ArrowRight />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const demoQuery = response.recommendations[0]?.statement ?? "technique MMA";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Réponse du coach</span>
            <Badge variant="outline" className="text-[0.65rem]">
              {providerName === "deterministic-fallback" ? "Règles déterministes" : `Modèle local · ${providerName}`}
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
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`MMA technique ${rec.statement}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-5 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    <Video className="size-3.5" /> Voir des démonstrations
                  </a>
                  {rec.basedOnFactIndexes.length > 0 ? (
                    <p className="pl-5 text-xs text-muted-foreground">
                      Basé sur:{" "}
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
        <div className="coach-video-heading">
          <span><Video aria-hidden="true" /> À voir maintenant</span>
          <h3 id="coach-videos">Démonstrations pour votre prochain entraînement</h3>
          <p>Des vidéos ciblées sur la priorité détectée par votre coach.</p>
        </div>
        {videos.length > 0 ? (
          <div className="coach-video-grid">
            {videos.map((video) => (
              <a key={video.videoId} href={video.url} target="_blank" rel="noreferrer" className="coach-video-card group">
                <Image src={video.thumbnail} alt="" width={640} height={360} sizes="(max-width: 767px) 100vw, 33vw" className="aspect-video w-full object-cover" />
                <span className="grid gap-1 p-3">
                  <strong className="line-clamp-2 text-sm group-hover:underline">{video.title}</strong>
                  <span className="text-xs text-muted-foreground">{video.channelTitle}</span>
                </span>
              </a>
            ))}
          </div>
        ) : (
          <Button variant="outline" render={<a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`MMA technique ${demoQuery}`)}`} target="_blank" rel="noreferrer" />}>
            <Video /> Chercher les démonstrations sur YouTube
          </Button>
        )}
      </section>

      <details className="group rounded-lg border border-border">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-muted-foreground marker:content-none">
          Voir les {context.facts.length} fait(s) utilisé(s)
        </summary>
        <ul className="flex flex-col gap-2 border-t border-border px-4 py-3">
          {context.facts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Badge variant={FACT_KIND_VARIANT[fact.kind]} className="mt-0.5 shrink-0 text-[0.65rem]">
                {FACT_KIND_LABELS[fact.kind]}
              </Badge>
              <span className="text-muted-foreground">{fact.statement}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
