"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Heart, NotebookPen, Video } from "lucide-react";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { addVideoFavorite, removeVideoFavorite } from "@/lib/usecases/youtube-favorites-actions";
import type { VideoSearchResult } from "@/lib/domain/video-search";

export function YouTubeVideoCard({ video, favoriteId }: { video: VideoSearchResult; favoriteId: string | null }) {
  const { t } = useI18n();
  const [id, setId] = useState(favoriteId);
  const [isPending, startTransition] = useTransition();

  const toggleFavorite = () => {
    startTransition(async () => {
      if (id) {
        await removeVideoFavorite(id);
        setId(null);
      } else {
        const created = await addVideoFavorite(video);
        setId(created.id);
      }
    });
  };

  return (
    <div className="youtube-video-card">
      <ProgressiveImage src={video.thumbnail} alt="" width={640} height={360} sizes="(max-width: 767px) 100vw, 33vw" className="aspect-video w-full object-cover" />
      <div className="grid gap-2 p-3">
        <strong className="line-clamp-2 text-sm">{video.title}</strong>
        <span className="text-xs text-muted-foreground">{video.channelTitle}</span>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            render={
              <Link
                href={`/youtube/${video.videoId}?title=${encodeURIComponent(video.title)}&channel=${encodeURIComponent(video.channelTitle)}`}
              />
            }
          >
            <NotebookPen /> {t("action.analyzeVideo", "Analyser")}
          </Button>
          <Button size="sm" variant="outline" render={<a href={video.url} target="_blank" rel="noreferrer" />}>
            <Video /> {t("action.openYoutube", "Voir sur YouTube")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={Boolean(id)}
            disabled={isPending}
            onClick={toggleFavorite}
          >
            <Heart className={id ? "fill-current" : undefined} /> {id ? t("action.favorited", "Favori") : t("action.favorite", "Ajouter aux favoris")}
          </Button>
        </div>
      </div>
    </div>
  );
}
