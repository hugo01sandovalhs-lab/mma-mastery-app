"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/infra/db/supabase-server";
import { tServer } from "@/lib/i18n-server";

export type AuthActionState = { error: string | null; message?: string | null };

export async function signInWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUpWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?confirm=1");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: await tServer("error.emailRequired", "Saisissez votre adresse email.") };

  const origin = (await headers()).get("origin");
  if (!origin) return { error: await tServer("error.originUnknown", "Impossible de déterminer l’adresse du site.") };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  return { error: null, message: await tServer("error.resetSent", "Si ce compte existe, un lien de réinitialisation vient d’être envoyé.") };
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");
  if (password.length < 8) return { error: await tServer("error.passwordTooShort", "Le mot de passe doit contenir au moins 8 caractères.") };
  if (password !== confirmation) return { error: await tServer("error.passwordMismatch", "Les mots de passe ne correspondent pas.") };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { error: null, message: await tServer("error.passwordUpdated", "Mot de passe mis à jour. Vous pouvez maintenant vous connecter.") };
}
