"use client";

import { useActionState } from "react";
import { TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteTrainingSession, type TrainingActionState } from "@/lib/usecases/training-actions";

export function DeleteSessionDialog({ sessionId }: { sessionId: string }) {
  const [state, formAction, isPending] = useActionState<TrainingActionState, FormData>(
    deleteTrainingSession.bind(null, sessionId),
    { error: null },
  );

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <TrashIcon /> Supprimer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer cette séance ?</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Les techniques et observations associées seront
            également supprimées.
          </DialogDescription>
        </DialogHeader>
        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <form action={formAction}>
            <Button type="submit" variant="destructive" className="w-full" disabled={isPending}>
              Confirmer la suppression
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
