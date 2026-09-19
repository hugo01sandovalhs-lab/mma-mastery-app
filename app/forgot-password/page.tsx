"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n-provider";
import { requestPasswordReset, type AuthActionState } from "@/lib/usecases/auth-actions";

const initialState: AuthActionState = { error: null };

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);
  const { t } = useI18n();
  return (
    <AuthShell hero="static" title={t("auth.forgot.title", "Récupérez votre accès")} intro={t("auth.forgot.intro", "Recevez un lien sécurisé pour choisir un nouveau mot de passe.")}>
      <form action={formAction} className="auth-form">
        <div>
          <Label htmlFor="email">{t("auth.forgot.emailLabel", "Email du compte")}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
        </div>
        {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="auth-success" role="status">{state.message}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={isPending || Boolean(state.message)}>
          {isPending ? t("auth.forgot.submitPending", "Envoi…") : t("auth.forgot.submit", "Envoyer le lien")}
        </Button>
        <p className="auth-switch"><Link href="/login">{t("auth.forgot.backToLogin", "Retour à la connexion")}</Link></p>
      </form>
    </AuthShell>
  );
}
