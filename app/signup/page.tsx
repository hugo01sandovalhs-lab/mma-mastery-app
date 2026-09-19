"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n-provider";
import { signUpWithPassword, type AuthActionState } from "@/lib/usecases/auth-actions";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUpWithPassword, initialState);
  const { t } = useI18n();
  return (
    <AuthShell hero="rotate" title={t("auth.signup.title", "Entrez dans l’arène")} intro={t("auth.signup.intro", "Créez votre espace de travail et commencez à suivre chaque round.")}>
      <form action={formAction} className="auth-form">
        <div>
          <Label htmlFor="email">{t("auth.signup.emailLabel", "Email")}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
        </div>
        <div>
          <Label htmlFor="password">{t("auth.signup.passwordLabel", "Mot de passe")}</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <p className="auth-hint">{t("auth.signup.passwordHint", "8 caractères minimum.")}</p>
        </div>
        {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? t("auth.signup.submitPending", "Création…") : t("auth.signup.submit", "Créer mon compte")}
        </Button>
        <p className="auth-switch">{t("auth.signup.haveAccount", "Déjà membre ?")} <Link href="/login">{t("auth.login", "Se connecter")}</Link></p>
      </form>
    </AuthShell>
  );
}
