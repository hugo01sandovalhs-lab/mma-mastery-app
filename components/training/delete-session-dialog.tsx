"use client";

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
import { deleteTrainingSession } from "@/lib/usecases/training-actions";

export function DeleteSessionDialog({ sessionId }: { sessionId: string }) {
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
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <form action={deleteTrainingSession.bind(null, sessionId)}>
            <Button type="submit" variant="destructive" className="w-full">
              Confirmer la suppression
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
