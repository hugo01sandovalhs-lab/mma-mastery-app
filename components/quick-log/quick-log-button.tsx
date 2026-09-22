"use client";

import { useState } from "react";
import { Dumbbell, Swords, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrainingForm } from "@/components/training/training-form";
import { useI18n } from "@/components/i18n-provider";
import { createTrainingSession } from "@/lib/usecases/training-actions";
import type { Discipline, SessionType } from "@/lib/domain/training";
import type { SkillListItem } from "@/lib/usecases/skill-actions";

/**
 * Global 1-2 click entry point to log a session/sparring round from
 * anywhere in the app, without navigating away. Wraps the exact same
 * `TrainingForm` + `createTrainingSession` used by `/training/new` — no
 * parallel validation/backend, only a faster way to reach the same form.
 */
export function QuickLogButton({
  disciplines,
  skills,
}: {
  disciplines: Discipline[];
  skills: SkillListItem[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>("class");

  if (disciplines.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="icon-lg"
            className="quick-log-fab"
            aria-label={t("quickLog.open")}
          />
        }
      >
        <Zap className="size-5" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("quickLog.title")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={sessionType === "sparring" ? "outline" : "default"}
            onClick={() => setSessionType("class")}
            className="justify-start gap-2"
          >
            <Dumbbell className="size-4" /> {t("action.newSession", "Nouvelle séance")}
          </Button>
          <Button
            type="button"
            variant={sessionType === "sparring" ? "default" : "outline"}
            onClick={() => setSessionType("sparring")}
            className="justify-start gap-2"
          >
            <Swords className="size-4" /> {t("action.newSparring", "Sparring")}
          </Button>
        </div>

        <TrainingForm
          key={sessionType}
          disciplines={disciplines}
          skills={skills}
          action={createTrainingSession}
          initialSessionType={sessionType}
          submitLabel={t("action.save", "Enregistrer")}
        />
      </DialogContent>
    </Dialog>
  );
}
