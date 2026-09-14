import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Dumbbell,
  MessageCircleQuestion,
  Network,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";

const FEATURES = [
  {
    icon: Dumbbell,
    title: "Journal d'entraînement",
    description:
      "Enregistrez chaque séance: discipline, durée, RPE, techniques travaillées et observations à chaud.",
  },
  {
    icon: Target,
    title: "Système de compétences",
    description:
      "Un catalogue de compétences relié à vos séances: prérequis, contres, enchaînements et variations.",
  },
  {
    icon: Network,
    title: "Progression mesurée",
    description:
      "Le stade de maîtrise de chaque compétence est calculé à partir de vos données réelles, jamais estimé.",
  },
  {
    icon: Sparkles,
    title: "Training Intelligence",
    description:
      "Un moteur déterministe identifie sur quoi vous concentrer à la prochaine séance, et pourquoi.",
  },
  {
    icon: BookOpen,
    title: "Boucle d'apprentissage",
    description:
      "Questions non résolues, difficultés récentes et compétences en pause reviennent au bon moment.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Coach IA",
    description:
      "Fondation en place pour un futur coach qui s'appuiera uniquement sur vos données réelles.",
    comingSoon: true,
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="font-heading text-base font-semibold tracking-tight">MMA Mastery</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Se connecter
          </Button>
          <Button size="sm" render={<Link href="/signup" />}>
            Créer un compte
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-4 py-12 sm:px-6 sm:py-20">
        <section className="flex flex-col items-start gap-6">
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="size-3.5 text-primary" /> Suivi d&apos;entraînement MMA
          </Badge>
          <h1 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
            Ton système personnel pour apprendre, entraîner et maîtriser le MMA.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Journal de séances, catalogue de compétences relié à votre pratique réelle, et un
            moteur déterministe qui vous dit sur quoi travailler ensuite — sans données
            inventées, sans score arbitraire.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" render={<Link href="/signup" />}>
              Commencer
            </Button>
            <Button variant="outline" size="lg" render={<Link href="/login" />}>
              Se connecter
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4.5" />
                    </span>
                    {f.comingSoon ? <Badge variant="secondary">Bientôt</Badge> : null}
                  </div>
                  <h2 className="font-medium">{f.title}</h2>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="flex flex-col items-start gap-4 border-t border-border pt-12">
          <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Vos données, votre progression.
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Aucune fonctionnalité n&apos;affiche une métrique inventée ou un score arbitraire.
            Chaque recommandation est explicable et provient de ce que vous avez réellement
            enregistré.
          </p>
          <Button render={<Link href="/signup" />}>Créer un compte gratuitement</Button>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        MMA Mastery
      </footer>
    </div>
  );
}
