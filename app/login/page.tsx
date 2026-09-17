"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword, type AuthActionState } from "@/lib/usecases/auth-actions";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInWithPassword, initialState);
  return (
    <AuthShell title="Retour au camp" intro="Retrouvez vos séances, vos objectifs et votre progression.">
      <form action={formAction} className="auth-form">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
        </div>
        <div>
          <div className="auth-label-row">
            <Label htmlFor="password">Mot de passe</Label>
            <Link href="/forgot-password">Mot de passe oublié ?</Link>
          </div>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "Connexion…" : "Se connecter"}
        </Button>
        <p className="auth-switch">Pas encore de compte ? <Link href="/signup">Créer un compte</Link></p>
      </form>
    </AuthShell>
  );
}
