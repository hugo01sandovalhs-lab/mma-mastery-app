"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RESOURCE_TYPE_LABEL_KEYS } from "@/lib/domain/knowledge";
import { deleteResource, type ResourceListItem } from "@/lib/usecases/knowledge-actions";
import { useI18n } from "@/components/i18n-provider";

export function ResourceRow({ resource }: { resource: ResourceListItem }) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-3">
        <div className="flex min-w-0 flex-col gap-1">
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium hover:underline"
          >
            {resource.title}
            {resource.timestamp_seconds ? ` (${Math.floor(resource.timestamp_seconds / 60)}:${String(resource.timestamp_seconds % 60).padStart(2, "0")})` : ""}
          </a>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t(RESOURCE_TYPE_LABEL_KEYS[resource.type])}</Badge>
            {resource.author ? <span className="text-xs text-muted-foreground">{resource.author}</span> : null}
          </div>
          {resource.notes ? <p className="text-sm text-muted-foreground">{resource.notes}</p> : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("resourceRow.deleteAria", "Supprimer la ressource")}
          disabled={isPending}
          onClick={() => startTransition(() => deleteResource(resource.id))}
        >
          <Trash2Icon />
        </Button>
      </CardContent>
    </Card>
  );
}
