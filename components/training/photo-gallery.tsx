"use client";

import { useActionState } from "react";
import { Camera, Ghost, MessageCircle, Share2, Trash2 } from "lucide-react";
import { deleteTrainingPhoto, uploadTrainingPhoto } from "@/lib/usecases/training-photo-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n-provider";

type Photo = { id: string; caption: string | null; created_at: string; url: string | null };
type Session = { id: string; date: string; title: string | null };

function ShareActions({ photo }: { photo: Photo }) {
  const { t } = useI18n();
  const url = photo.url ?? "";
  const text = photo.caption || t("photo.defaultCaptionText", "Mon entraînement MMA");
  const share = () => navigator.share?.({ title: "MMA Mastery", text, url });
  return <div className="photo-share" aria-label={t("photo.shareLabel", "Partager la photo")}>
    <Button type="button" size="icon-sm" variant="ghost" aria-label={t("photo.shareAria", "Partager")} onClick={share}><Share2 /></Button>
    <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noreferrer" aria-label={t("photo.shareWhatsapp", "Partager sur WhatsApp")}><MessageCircle /></a>
    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" aria-label={t("photo.shareFacebook", "Partager sur Facebook")}><span aria-hidden="true">f</span></a>
    <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label={t("photo.openInstagram", "Ouvrir Instagram")}><span aria-hidden="true">IG</span></a>
    <a href="https://www.snapchat.com/" target="_blank" rel="noreferrer" aria-label={t("photo.openSnapchat", "Ouvrir Snapchat")}><Ghost /></a>
  </div>;
}

export function PhotoGallery({ photos, sessions }: { photos: Photo[]; sessions: Session[] }) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState(uploadTrainingPhoto, { error: null });
  return <div className="grid gap-6">
    <form action={action} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 rounded-md border bg-card p-5 sm:grid-cols-2">
      <div className="grid gap-2"><Label htmlFor="photo">{t("photo.label", "Photo")}</Label><Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required /></div>
      <div className="grid gap-2"><Label htmlFor="caption">{t("photo.captionLabel", "Légende")}</Label><Input id="caption" name="caption" maxLength={240} /></div>
      <div className="grid min-w-0 gap-2"><Label htmlFor="session_id">{t("photo.linkedSession", "Séance liée")}</Label><select id="session_id" name="session_id" className="h-10 w-full min-w-0 rounded-md border bg-card px-3 text-sm"><option value="">{t("photo.none", "Aucune")}</option>{sessions.map((session) => <option key={session.id} value={session.id}>{new Date(session.date).toLocaleDateString(locale)} · {session.title || t("photo.sessionFallback", "Séance")}</option>)}</select></div>
      <div className="flex items-end"><Button type="submit" disabled={pending}><Camera />{pending ? t("photo.uploading", "Envoi…") : t("photo.addToGallery", "Ajouter à la galerie")}</Button></div>
      {state.error ? <p role="alert" className="text-sm text-destructive sm:col-span-2">{state.error}</p> : null}
    </form>
    {photos.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-md border bg-card">
      {/* Private signed URLs are short-lived and cannot be configured as a stable Next image source. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo.url ? <img src={photo.url} alt={photo.caption ?? t("photo.defaultAlt", "Photo d’entraînement")} className="aspect-[4/3] w-full object-cover" loading="lazy" decoding="async" /> : <div className="aspect-[4/3] bg-muted" />}
      <div className="grid gap-2 p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm">{photo.caption || t("photo.trainingFallback", "Entraînement")}</p><form action={deleteTrainingPhoto.bind(null, photo.id)}><Button type="submit" size="icon-sm" variant="ghost" aria-label={t("photo.deleteAlt", "Supprimer la photo")}><Trash2 /></Button></form></div>{photo.url ? <ShareActions photo={photo} /> : null}</div>
    </article>)}</div> : <div className="editorial-empty rounded-md border bg-card p-6"><Camera /><p>{t("photo.empty", "Aucune photo")}</p><p className="text-sm text-muted-foreground">{t("photo.emptyHint", "Ajoutez votre premier souvenir d’entraînement.")}</p></div>}
  </div>;
}
