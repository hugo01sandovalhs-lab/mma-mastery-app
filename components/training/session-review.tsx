"use client";

import { DownloadIcon } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SESSION_TYPE_LABEL_KEYS, OBSERVATION_TYPE_LABEL_KEYS } from "@/lib/domain/training";
import type { TrainingSessionDetail } from "@/lib/usecases/training-actions";

type Translate = (key: string, fallback?: string, vars?: Record<string, string | number>) => string;

function buildExportText(session: TrainingSessionDetail, t: Translate): string {
  const lines: string[] = [];
  const sessionTypeLabel = t(SESSION_TYPE_LABEL_KEYS[session.session_type], session.session_type);
  lines.push(session.title || sessionTypeLabel);
  lines.push(session.date);
  lines.push(`${session.discipline.name} · ${sessionTypeLabel}`);
  if (session.duration_minutes) lines.push(`${session.duration_minutes} min`);
  if (session.rpe) lines.push(`RPE ${session.rpe}`);
  lines.push("");

  if (session.techniques.length > 0) {
    lines.push("Techniques:");
    for (const t2 of session.techniques) {
      const parts = [t2.technique_name];
      if (t2.category) parts.push(`(${t2.category})`);
      if (t2.outcome) parts.push(`- ${t2.outcome}`);
      lines.push(`- ${parts.join(" ")}`);
      if (t2.notes) lines.push(`  ${t2.notes}`);
    }
    lines.push("");
  }

  if (session.observations.length > 0) {
    lines.push("Observations:");
    for (const o of session.observations) {
      lines.push(`- [${t(OBSERVATION_TYPE_LABEL_KEYS[o.type], o.type)}] ${o.content}`);
    }
    lines.push("");
  }

  if (session.notes) {
    lines.push("Notes:");
    lines.push(session.notes);
  }

  return lines.join("\n");
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SessionReviewCard({ session }: { session: TrainingSessionDetail }) {
  const { t } = useI18n();

  const successCount = session.observations.filter((o) => o.type === "success").length;
  const difficulties = session.observations.filter((o) => o.type === "difficulty");
  const successes = session.observations.filter((o) => o.type === "success");
  const hasData = session.techniques.length > 0 || session.observations.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-semibold">
          {t("review.sixtySeconds", "Review en 60 secondes")}
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            downloadText(`seance-${session.date}.txt`, buildExportText(session, t))
          }
        >
          <DownloadIcon /> {t("action.exportText", "Exporter en texte")}
        </Button>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">{t("review.noData", "Ajoutez des observations pour une review plus riche.")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <li>{t("review.techniquesWorked", "{count} technique(s) travaillée(s)", { count: session.techniques.length })}</li>
            <li>{t("review.difficultiesFlagged", "{count} difficulté(s) relevée(s)", { count: difficulties.length })}</li>
            <li>{t("review.successesLogged", "{count} réussite(s) notée(s)", { count: successCount })}</li>
            {difficulties[0] ? (
              <li className="text-foreground">
                {t("review.focusNextTime", "À travailler la prochaine fois : {text}", { text: difficulties[0].content })}
              </li>
            ) : null}
            {successes[0] ? (
              <li className="text-foreground">
                {t("review.keepDoing", "À reproduire : {text}", { text: successes[0].content })}
              </li>
            ) : null}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
