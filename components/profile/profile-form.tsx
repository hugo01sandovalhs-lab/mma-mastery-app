"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/profile/actions";
import type { Profile } from "@/lib/domain/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const fields = [
  ["first_name", "Prénom"], ["last_name", "Nom"], ["age", "Âge", "number"],
  ["height_cm", "Taille (cm)", "number"], ["weight_kg", "Poids (kg)", "number"],
  ["years_practicing", "Années de pratique", "number"], ["dominant_stance", "Garde dominante"],
  ["weight_class", "Catégorie de poids"],
] as const;

const listFields = [
  ["titles_belts", "Titres / ceintures"], ["disciplines", "Disciplines pratiquées"],
  ["preferred_techniques", "Techniques préférées"], ["training_music", "Musiques d’entraînement"],
] as const;

const linkFields = [
  ["youtube_url", "YouTube"], ["spotify_url", "Spotify"], ["deezer_url", "Deezer"],
  ["apple_music_url", "Apple Music"],
] as const;

export function ProfileForm({ profile }: { profile: Partial<Profile> | null }) {
  const [state, action, pending] = useActionState(updateProfile, { error: null, saved: false });
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([name, label, type]) => (
          <div key={name} className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} type={type ?? "text"} defaultValue={String(profile?.[name] ?? "")} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {listFields.map(([name, label]) => (
          <div key={name} className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} defaultValue={(profile?.[name] ?? []).join(", ")} placeholder="Séparez par des virgules" />
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="current_goals">Objectifs actuels</Label>
        <Textarea id="current_goals" name="current_goals" defaultValue={profile?.current_goals ?? ""} rows={3} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {linkFields.map(([name, label]) => (
          <div key={name} className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} type="url" defaultValue={profile?.[name] ?? ""} placeholder="https://" />
          </div>
        ))}
      </div>
      <div className="grid max-w-xs gap-2">
        <Label htmlFor="profile_visibility">Visibilité</Label>
        <select id="profile_visibility" name="profile_visibility" defaultValue={profile?.profile_visibility ?? "private"} className="h-10 rounded-md border bg-card px-3 text-sm">
          <option value="private">Privé</option><option value="public">Public</option>
        </select>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.saved ? <p className="text-sm text-emerald-700">Profil enregistré.</p> : null}
      <Button type="submit" className="w-fit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer le profil"}</Button>
    </form>
  );
}
