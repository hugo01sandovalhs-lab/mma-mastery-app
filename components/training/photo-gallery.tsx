"use client";

import { useActionState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { deleteTrainingPhoto, uploadTrainingPhoto } from "@/lib/usecases/training-photo-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Photo = { id: string; caption: string | null; created_at: string; url: string | null };
type Session = { id: string; date: string; title: string | null };

export function PhotoGallery({ photos, sessions }: { photos: Photo[]; sessions: Session[] }) {
  const [state, action, pending] = useActionState(uploadTrainingPhoto, { error: null });
  return <div className="grid gap-6">
    <form action={action} className="grid gap-4 rounded-md border bg-card p-5 sm:grid-cols-2">
      <div className="grid gap-2"><Label htmlFor="photo">Photo</Label><Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required /></div>
      <div className="grid gap-2"><Label htmlFor="caption">Légende</Label><Input id="caption" name="caption" maxLength={240} /></div>
      <div className="grid gap-2"><Label htmlFor="session_id">Séance liée</Label><select id="session_id" name="session_id" className="h-10 rounded-md border bg-card px-3 text-sm"><option value="">Aucune</option>{sessions.map((session) => <option key={session.id} value={session.id}>{new Date(session.date).toLocaleDateString("fr-FR")} · {session.title || "Séance"}</option>)}</select></div>
      <div className="flex items-end"><Button type="submit" disabled={pending}><Camera />{pending ? "Envoi…" : "Ajouter à la galerie"}</Button></div>
      {state.error ? <p className="text-sm text-destructive sm:col-span-2">{state.error}</p> : null}
    </form>
    {photos.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-md border bg-card">
      {/* Private signed URLs are short-lived and cannot be configured as a stable Next image source. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo.url ? <img src={photo.url} alt={photo.caption ?? "Photo d’entraînement"} className="aspect-[4/3] w-full object-cover" loading="lazy" /> : <div className="aspect-[4/3] bg-muted" />}
      <div className="flex items-center justify-between gap-3 p-3"><p className="text-sm">{photo.caption || "Entraînement"}</p><form action={deleteTrainingPhoto.bind(null, photo.id)}><Button type="submit" size="icon-sm" variant="ghost" aria-label="Supprimer la photo"><Trash2 /></Button></form></div>
    </article>)}</div> : <div className="editorial-empty rounded-md border bg-card p-6"><Camera /><p>Aucune photo</p><p className="text-sm text-muted-foreground">Ajoutez votre premier souvenir d’entraînement.</p></div>}
  </div>;
}
