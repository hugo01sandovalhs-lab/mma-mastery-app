"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VIDEO_NOTE_KINDS,
  decodeVideoNote,
  encodeVideoNote,
  formatTimestamp,
  type VideoNoteKind,
} from "@/lib/domain/video-notes";
import { createResource, deleteResource, type ResourceListItem } from "@/lib/usecases/knowledge-actions";
import type { SkillListItem } from "@/lib/usecases/skill-actions";
import type { DICTIONARIES, Locale } from "@/lib/i18n";

type YTPlayerLike = {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string,
        opts: { videoId: string; events?: { onReady?: () => void } },
      ) => YTPlayerLike;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const NOTE_KIND_KEYS: Record<
  VideoNoteKind,
  "videoNote.kind.detail" | "videoNote.kind.timing" | "videoNote.kind.error" | "videoNote.kind.toTest"
> = {
  detail: "videoNote.kind.detail",
  timing: "videoNote.kind.timing",
  error: "videoNote.kind.error",
  toTest: "videoNote.kind.toTest",
};

type Dict = (typeof DICTIONARIES)[Locale];

export function VideoAnalysis({
  videoId,
  url,
  title,
  channel,
  initialNotes,
  skills,
  dict,
}: {
  videoId: string;
  url: string;
  title: string;
  channel: string | null;
  initialNotes: ResourceListItem[];
  skills: SkillListItem[];
  dict: Dict;
}) {
  const router = useRouter();
  const playerContainerId = `yt-player-${videoId}`;
  const playerRef = useRef<YTPlayerLike | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [kind, setKind] = useState<VideoNoteKind>("detail");
  const [content, setContent] = useState("");
  const [skillName, setSkillName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setNotes(initialNotes), [initialNotes]);

  useEffect(() => {
    function createPlayer() {
      if (!window.YT) return;
      playerRef.current = new window.YT.Player(playerContainerId, { videoId });
    }
    if (window.YT?.Player) {
      createPlayer();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      createPlayer();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, [playerContainerId, videoId]);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  function resolveSkillId(name: string): string | undefined {
    const match = skills.find((s) => s.name.trim().toLowerCase() === name.trim().toLowerCase());
    return match?.id;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length === 0) return;
    const timestamp = Math.floor(playerRef.current?.getCurrentTime() ?? 0);
    const skillId = skillName.trim() ? resolveSkillId(skillName) : undefined;

    const fd = new FormData();
    fd.set("type", "video");
    fd.set("title", title);
    fd.set("author", channel ?? "");
    fd.set("url", url);
    if (skillId) fd.set("skill_id", skillId);
    fd.set("timestamp_seconds", String(timestamp));
    fd.set("notes", encodeVideoNote(kind, content));

    startTransition(async () => {
      const result = await createResource({ error: null }, fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setContent("");
      setSkillName("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteResource(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {channel ? <p className="text-sm text-muted-foreground">{channel}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <div id={playerContainerId} className="size-full" />
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-4">
              <Select value={kind} onValueChange={(v) => setKind(v as VideoNoteKind)} items={VIDEO_NOTE_KINDS.map((k) => ({ value: k, label: dict[NOTE_KIND_KEYS[k]] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_NOTE_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>{dict[NOTE_KIND_KEYS[k]]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={dict["videoNote.placeholder"]}
                  rows={3}
                />
                <datalist id="video-note-skills">
                  {skills.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
                <Input
                  list="video-note-skills"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder={dict["videoNote.skillPlaceholder"]}
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" disabled={isPending || content.trim().length === 0}>
                  {dict["videoNote.add"]}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict["videoNote.empty"]}</p>
            ) : (
              notes.map((n) => <VideoNoteRow key={n.id} note={n} dict={dict} onSeek={seekTo} onDelete={handleDelete} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoNoteRow({
  note,
  dict,
  onSeek,
  onDelete,
}: {
  note: ResourceListItem;
  dict: Dict;
  onSeek: (seconds: number) => void;
  onDelete: (id: string) => void;
}) {
  const { kind, text } = decodeVideoNote(note.notes ?? "");
  const seconds = note.timestamp_seconds ?? 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onSeek(seconds)}>
            {formatTimestamp(seconds)}
          </Button>
          {kind ? <Badge variant="secondary">{dict[NOTE_KIND_KEYS[kind]]}</Badge> : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label={dict["videoNote.delete"]}
            onClick={() => onDelete(note.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        <p className="text-sm">{text}</p>
        <Link
          href={`/training/new?type=drilling&note=${encodeURIComponent(text)}`}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Dumbbell className="size-3.5" /> {dict["videoNote.addToNextTraining"]}
        </Link>
      </CardContent>
    </Card>
  );
}
