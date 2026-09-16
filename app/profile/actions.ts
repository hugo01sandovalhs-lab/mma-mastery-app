"use server";

import { revalidatePath } from "next/cache";
import { profileInputSchema } from "@/lib/domain/profile";
import { createClient } from "@/lib/infra/db/supabase-server";

export type ProfileActionState = { error: string | null; saved: boolean };

export async function updateProfile(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = profileInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Profil invalide", saved: false };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée", saved: false };

  const { error } = await supabase.from("profiles").update(parsed.data).eq("user_id", user.id);
  if (error) return { error: error.message, saved: false };
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { error: null, saved: true };
}
