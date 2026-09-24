"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getServerLocale, tServer } from "@/lib/i18n-server";

export type AuthActionState = { error: string | null; message?: string | null };

async function friendlyAuthError(message: string): Promise<string> {
  const locale = await getServerLocale();
  const kind = /invalid login|invalid credentials/i.test(message)
    ? "credentials"
    : /email not confirmed/i.test(message)
      ? "confirmation"
      : /already registered|user already exists/i.test(message)
        ? "exists"
        : /rate limit|too many requests|email rate limit/i.test(message)
          ? "rate"
          : "generic";
  const messages = {
    fr: { credentials: "Email ou mot de passe incorrect.", confirmation: "Confirmez d’abord votre adresse email.", exists: "Un compte existe déjà avec cette adresse.", rate: "Trop de tentatives. Réessayez dans quelques minutes.", generic: "Impossible de terminer cette action. Réessayez dans un instant." },
    en: { credentials: "Incorrect email or password.", confirmation: "Confirm your email address first.", exists: "An account already exists with this address.", rate: "Too many attempts. Try again in a few minutes.", generic: "Unable to complete this action. Try again shortly." },
    es: { credentials: "Correo o contraseña incorrectos.", confirmation: "Confirma primero tu correo electrónico.", exists: "Ya existe una cuenta con esta dirección.", rate: "Demasiados intentos. Inténtalo de nuevo en unos minutos.", generic: "No se pudo completar esta acción. Inténtalo de nuevo en breve." },
    de: { credentials: "E-Mail oder Passwort ist falsch.", confirmation: "Bestätigen Sie zuerst Ihre E-Mail-Adresse.", exists: "Für diese Adresse besteht bereits ein Konto.", rate: "Zu viele Versuche. Bitte versuchen Sie es in einigen Minuten erneut.", generic: "Diese Aktion konnte nicht abgeschlossen werden. Bitte versuchen Sie es gleich erneut." },
    ru: { credentials: "Неверный email или пароль.", confirmation: "Сначала подтвердите адрес электронной почты.", exists: "Аккаунт с этим адресом уже существует.", rate: "Слишком много попыток. Повторите через несколько минут.", generic: "Не удалось выполнить действие. Повторите попытку чуть позже." },
    ja: { credentials: "メールアドレスまたはパスワードが正しくありません。", confirmation: "先にメールアドレスを確認してください。", exists: "このアドレスのアカウントは既に存在します。", rate: "試行回数が多すぎます。数分後に再試行してください。", generic: "操作を完了できませんでした。しばらくしてから再試行してください。" },
  } as const;
  return messages[locale][kind];
}

export async function signInWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: await friendlyAuthError(error.message) };
  }

  // The client Router Cache may still hold the pre-login (redirect-to-login) response
  // for /dashboard from before the session cookie was set; without this, that stale
  // entry can render on the first landing and only refreshes after navigating away
  // and back.
  revalidatePath("/dashboard", "layout");
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
    return { error: await friendlyAuthError(error.message) };
  }

  redirect("/login?confirm=1");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resendConfirmation(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: await tServer("error.emailRequired", "Saisissez votre adresse email.") };
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: origin ? { emailRedirectTo: `${origin}/auth/callback` } : undefined,
  });
  if (error) return { error: await friendlyAuthError(error.message) };
  return { error: null, message: await tServer("error.resetSent", "Si ce compte existe, un email vient d’être envoyé.") };
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

  if (error) return { error: await friendlyAuthError(error.message) };
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
  if (error) return { error: await friendlyAuthError(error.message) };
  return { error: null, message: await tServer("error.passwordUpdated", "Mot de passe mis à jour. Vous pouvez maintenant vous connecter.") };
}
