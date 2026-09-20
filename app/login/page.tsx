"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthShell, type Cover } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n-provider";
import { signInWithPassword, type AuthActionState } from "@/lib/usecases/auth-actions";

const initialState: AuthActionState = { error: null };

const LOGIN_COVERS: Cover[] = [
  {
    src: "/mma-mastery-photos/anastase-maragos-DFKJZDLZsm4-unsplash.jpg",
    alt: "Deux combattants enlacés en position de clinch sur un ring",
    labelKey: "authCover.ring",
    label: "Ring",
    position: "50% 42%",
  },
  {
    src: "/mma-mastery-photos/pexels-cottonbro-4761790.jpg",
    alt: "Boxeur silhouetté, tête baissée après l'effort",
    labelKey: "authCover.strike",
    label: "Frappe",
    position: "62% 55%",
  },
  {
    src: "/mma-mastery-photos/redd-francisco-2sDljIb2cJs-unsplash.jpg",
    alt: "Deux combattants face à face dans la cage avant le combat",
    labelKey: "authCover.cage",
    label: "Cage",
    position: "50% 62%",
  },
  {
    src: "/mma-mastery-photos/pexels-gera-cejas-3616330-38758889.jpg",
    alt: "Combattante ajustant ses gants avant l'entraînement",
    labelKey: "authCover.training",
    label: "Entraînement",
    position: "38% 30%",
  },
  {
    src: "/mma-mastery-photos/ahmad-thomas-ulFi8aO6Xdk-unsplash.jpg",
    alt: "Coach tenant les paos face à un combattant en plein coup de pied",
    labelKey: "authCover.pads",
    label: "Paos",
    position: "42% 35%",
  },
];

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInWithPassword, initialState);
  const { t } = useI18n();
  return (
    <AuthShell hero="rotate" covers={LOGIN_COVERS} title={t("auth.login.title", "Retour au camp")} intro={t("auth.login.intro", "Retrouvez vos séances, vos objectifs et votre progression.")}>
      <form action={formAction} className="auth-form">
        <div>
          <Label htmlFor="email">{t("auth.login.emailLabel", "Email")}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
        </div>
        <div>
          <div className="auth-label-row">
            <Label htmlFor="password">{t("auth.login.passwordLabel", "Mot de passe")}</Label>
            <Link href="/forgot-password">{t("auth.forgot", "Mot de passe oublié ?")}</Link>
          </div>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? t("auth.login.submitPending", "Connexion…") : t("auth.login.submit", "Se connecter")}
        </Button>
        <p className="auth-switch">{t("auth.login.noAccount", "Pas encore de compte ?")} <Link href="/signup">{t("auth.login.createAccount", "Créer un compte")}</Link></p>
      </form>
    </AuthShell>
  );
}
