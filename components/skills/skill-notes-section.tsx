"use client";

import { useActionState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createSkillNote, deleteSkillNote, type KnowledgeActionState, type SkillNote } from "@/lib/usecases/knowledge-actions";
import { useI18n } from "@/components/i18n-provider";

export function SkillNotesSection({ skillId, notes }: { skillId: string; notes: SkillNote[] }) {
  const { t } = useI18n();
  const initialState: KnowledgeActionState = { error: null };
  const [state, formAction, isPending] = useActionState(createSkillNote, initialState);
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="skill_id" value={skillId} />
        <Textarea name="content" placeholder={t("skillNote.placeholder", "Ajouter une note personnelle sur cette compétence...")} rows={2} required />
        {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isPending}>
            {t("skillNote.submit", "Ajouter la note")}
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("skillNote.empty", "Aucune note pour l'instant.")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="flex items-start justify-between gap-3 py-3">
                <p className="min-w-0 flex-1 text-sm whitespace-pre-wrap">{note.content}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("skillNote.deleteAria", "Supprimer la note")}
                  disabled={isDeleting}
                  onClick={() => startDeleteTransition(() => deleteSkillNote(note.id, skillId))}
                >
                  <Trash2Icon />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
