"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithPassword, type AuthActionState } from "@/lib/usecases/auth-actions";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUpWithPassword, initialState);
  return (
    <AuthShell title="Entrez dans l’arène" intro="Créez votre espace de travail et commencez à suivre chaque round.">
      <form action={formAction} className="auth-form">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          <p className="auth-hint">8 caractères minimum.</p>
        </div>
        {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "Création…" : "Créer mon compte"}
        </Button>
        <p className="auth-switch">Déjà membre ? <Link href="/login">Se connecter</Link></p>
      </form>
    </AuthShell>
  );
}
