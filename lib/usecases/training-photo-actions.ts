"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import { tServer } from "@/lib/i18n-server";

const BUCKET = "training-photos";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export type PhotoActionState = { error: string | null };

export async function uploadTrainingPhoto(
  _state: PhotoActionState,
  formData: FormData,
): Promise<PhotoActionState> {
  const file = formData.get("photo");
  if (!(file instanceof File) || !file.size) return { error: await tServer("error.choosePhoto", "Choisissez une photo.") };
  if (!ALLOWED_TYPES.has(file.type) || file.size > 8 * 1024 * 1024) return { error: await tServer("error.photoFormat", "Format JPEG, PNG ou WebP, 8 Mo maximum.") };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: await tServer("error.sessionExpired", "Session expirée.") };

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `${user.id}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const caption = String(formData.get("caption") ?? "").trim().slice(0, 240) || null;
  const sessionId = String(formData.get("session_id") ?? "").trim() || null;
  const { error } = await supabase.from("training_photos").insert({ user_id: user.id, storage_path: storagePath, caption, session_id: sessionId });
  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: error.message };
  }
  revalidatePath("/training/photos");
  return { error: null };
}

export async function deleteTrainingPhoto(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("training_photos").select("storage_path").eq("id", id).single();
  if (!data) return;
  const { error } = await supabase.from("training_photos").delete().eq("id", id);
  if (!error) await supabase.storage.from(BUCKET).remove([data.storage_path]);
  revalidatePath("/training/photos");
}

export async function getTrainingPhotos() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("training_photos").select("id, storage_path, caption, session_id, created_at").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return Promise.all((data ?? []).map(async (photo) => {
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(photo.storage_path, 3600);
    return { ...photo, url: signed?.signedUrl ?? null };
  }));
}
