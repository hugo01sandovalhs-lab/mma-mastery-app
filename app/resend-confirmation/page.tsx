"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n-provider";
import { resendConfirmation, type AuthActionState } from "@/lib/usecases/auth-actions";

const initialState: AuthActionState = { error: null };

export default function ResendConfirmationPage() {
  const [state, action, pending] = useActionState(resendConfirmation, initialState);
  const [cooldown, setCooldown] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!state.message) return;
    setCooldown(true);
    const timeout = setTimeout(() => setCooldown(false), 60_000);
    return () => clearTimeout(timeout);
  }, [state]);

  const locked = pending || cooldown;

  return (
    <AuthShell hero="static" title={t("auth.resend.title", "Confirmer votre adresse")} intro={t("auth.resend.intro", "Recevez un nouveau lien de confirmation sécurisé.")}>
      <form action={action} className="auth-form" onSubmit={(event) => { if (locked) event.preventDefault(); }}>
        <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" autoFocus /></div>
        {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="auth-success" role="status">{state.message}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={locked}>{pending ? t("auth.forgot.submitPending", "Envoi…") : t("auth.resend.submit", "Renvoyer le lien")}</Button>
        <p className="auth-switch"><Link href="/login">{t("auth.forgot.backToLogin", "Retour à la connexion")}</Link></p>
      </form>
    </AuthShell>
  );
}
