import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Dumbbell, Network, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHero } from "@/components/landing/landing-hero";
import { createClient } from "@/lib/infra/db/supabase-server";

const FEATURES = [
  { icon: Dumbbell, title: "Journal", description: "Chaque séance, technique et sensation reste exploitable." },
  { icon: Target, title: "Maîtrise", description: "Une progression mesurée à partir de votre pratique réelle." },
  { icon: Network, title: "Intelligence", description: "Le prochain travail prioritaire, expliqué sans score inventé." },
  { icon: BookOpen, title: "Étude", description: "Difficultés, ressources et révisions réunies au bon moment." },
] as const;

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="championship-landing">
      <header className="landing-nav">
        <Link href="/" className="landing-brand" aria-label="MMA Mastery, accueil">
          <span>MM</span>
          <strong>MMA Mastery</strong>
        </Link>
        <nav aria-label="Compte" className="landing-account">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>Se connecter</Button>
          <Button size="sm" render={<Link href="/signup" />}>Entrer dans l&apos;arène</Button>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <LandingHero />
          <div className="landing-hero-copy">
            <p className="landing-kicker"><Sparkles aria-hidden="true" /> Le système d&apos;entraînement du combattant</p>
            <h1>Transformez chaque round en progression.</h1>
            <p className="landing-intro">
              Structurez vos séances, comprenez vos difficultés et arrivez au prochain entraînement avec un plan clair.
            </p>
            <div className="landing-actions">
              <Button size="lg" render={<Link href="/signup" />}>
                Commencer maintenant <ArrowRight />
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/login" />}>
                J&apos;ai déjà un compte
              </Button>
            </div>
          </div>
        </section>

        <section className="landing-manifesto" aria-labelledby="landing-method-title">
          <div>
            <p className="landing-kicker">Votre camp. Vos données. Votre cap.</p>
            <h2 id="landing-method-title">Une méthode complète, sans bruit.</h2>
          </div>
          <p>
            MMA Mastery relie ce que vous entraînez, ce que vous maîtrisez et ce qui mérite votre attention. Le Coach transforme ces faits en recommandations et démonstrations utiles.
          </p>
        </section>

        <section className="landing-feature-grid" aria-label="Fonctionnalités principales">
          {FEATURES.map(({ icon: Icon, title, description }, index) => (
            <article key={title}>
              <span className="landing-feature-index">0{index + 1}</span>
              <Icon aria-hidden="true" />
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>

        <section className="landing-final">
          <div><Sparkles aria-hidden="true" /><span>Coach IA + démonstrations vidéo</span></div>
          <h2>Le combat se prépare avant d&apos;entrer dans la cage.</h2>
          <Button size="lg" render={<Link href="/signup" />}>Créer mon espace <ArrowRight /></Button>
        </section>
      </main>

      <footer className="landing-footer"><span>MMA Mastery</span><span>Construire. Comprendre. Maîtriser.</span></footer>
    </div>
  );
}
