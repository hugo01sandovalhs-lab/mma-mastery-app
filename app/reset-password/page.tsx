"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword, type AuthActionState } from "@/lib/usecases/auth-actions";

const initialState: AuthActionState = { error: null };

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);
  return (
    <AuthShell title="Nouveau mot de passe" intro="Choisissez un accès solide pour reprendre votre progression.">
      <form action={formAction} className="auth-form">
        <div>
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" autoFocus />
        </div>
        <div>
          <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
          <Input id="password_confirmation" name="password_confirmation" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="auth-success" role="status">{state.message} <Link href="/login">Se connecter</Link></p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={isPending || Boolean(state.message)}>
          {isPending ? "Mise à jour…" : "Mettre à jour"}
        </Button>
      </form>
    </AuthShell>
  );
}
