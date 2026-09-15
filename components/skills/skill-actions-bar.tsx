"use client";

import { useTransition } from "react";
import { BookmarkIcon, ListPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { addToStudyQueue, toggleBookmark } from "@/lib/usecases/knowledge-actions";

export function SkillActionsBar({
  skillId,
  initiallyBookmarked,
  alreadyQueued,
}: {
  skillId: string;
  initiallyBookmarked: boolean;
  alreadyQueued: boolean;
}) {
  const [isBookmarkPending, startBookmarkTransition] = useTransition();
  const [isQueuePending, startQueueTransition] = useTransition();
  const path = `/skills/${skillId}`;

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isBookmarkPending}
        onClick={() => startBookmarkTransition(() => toggleBookmark("skill", skillId, path))}
      >
        <BookmarkIcon className={cn(initiallyBookmarked && "fill-current")} />
        {initiallyBookmarked ? "Favori" : "Ajouter aux favoris"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isQueuePending || alreadyQueued}
        onClick={() => startQueueTransition(() => addToStudyQueue(skillId, path))}
      >
        <ListPlusIcon /> {alreadyQueued ? "Dans la file d'étude" : "Ajouter à la file d'étude"}
      </Button>
    </div>
  );
}
