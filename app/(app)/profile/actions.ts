"use server";

import { revalidatePath } from "next/cache";
import { profileInputSchema } from "@/lib/domain/profile";
import { friendCodeSchema } from "@/lib/domain/training-partner";
import { createClient } from "@/lib/infra/db/supabase-server";

export type ProfileActionState = { error: string | null; saved: boolean };
export type PartnerActionState = { error: string | null; saved: boolean };

export async function addTrainingPartner(
  _state: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const parsed = friendCodeSchema.safeParse(formData.get("friend_code"));
  if (!parsed.success) return { error: "Code ami invalide", saved: false };
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_training_partner", { p_code: parsed.data });
  if (error) {
    const message = error.message.includes("yourself") ? "Vous ne pouvez pas vous ajouter." :
      error.message.includes("not found") ? "Aucun partenaire ne correspond à ce code." : error.message;
    return { error: message, saved: false };
  }
  revalidatePath("/profile");
  return { error: null, saved: true };
}

export async function removeTrainingPartner(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("remove_training_partner", { p_relationship_id: id });
  revalidatePath("/profile");
}

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
