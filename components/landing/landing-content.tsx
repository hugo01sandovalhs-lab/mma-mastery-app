"use client";

import Link from "next/link";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { ArrowRight, BookOpen, Dumbbell, Network, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHero } from "@/components/landing/landing-hero";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/i18n-provider";
import { LANDING_FINAL_PHOTO } from "@/lib/design/photography";

const FEATURES = [
  { icon: Dumbbell, key: "landing.feature1" },
  { icon: Target, key: "landing.feature2" },
  { icon: Network, key: "landing.feature3" },
  { icon: BookOpen, key: "landing.feature4" },
] as const;

export function LandingContent() {
  const { t } = useI18n();

  return (
    <div className="championship-landing">
      <header className="landing-nav">
        <Link href="/" className="landing-brand" aria-label="MMA Mastery, accueil">
          <span>MM</span>
          <strong>MMA Mastery</strong>
        </Link>
        <nav aria-label="Compte" className="landing-account">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>{t("auth.login", "Se connecter")}</Button>
          <Button size="sm" render={<Link href="/signup" />}>{t("landing.ctaEnterArena", "Entrer dans l'arène")}</Button>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <LandingHero />
          <div className="landing-hero-copy">
            <p className="landing-kicker"><Sparkles aria-hidden="true" /> {t("landing.kicker", "Le système d'entraînement du combattant")}</p>
            <h1>{t("landing.title", "Transformez chaque round en progression.")}</h1>
            <p className="landing-intro">{t("landing.intro", "Structurez vos séances, comprenez vos difficultés et arrivez au prochain entraînement avec un plan clair.")}</p>
            <div className="landing-actions">
              <Button size="lg" render={<Link href="/signup" />}>
                {t("landing.ctaStart", "Commencer maintenant")} <ArrowRight />
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/login" />}>
                {t("landing.ctaHaveAccount", "J'ai déjà un compte")}
              </Button>
            </div>
          </div>
        </section>

        <section className="landing-manifesto" aria-labelledby="landing-method-title">
          <div>
            <p className="landing-kicker">{t("landing.manifestoKicker", "Votre camp. Vos données. Votre cap.")}</p>
            <h2 id="landing-method-title">{t("landing.manifestoTitle", "Une méthode complète, sans bruit.")}</h2>
          </div>
          <p>{t("landing.manifestoBody", "MMA Mastery relie ce que vous entraînez, ce que vous maîtrisez et ce qui mérite votre attention. Le Coach transforme ces faits en recommandations et démonstrations utiles.")}</p>
        </section>

        <section className="landing-feature-grid" aria-label={t("landing.featuresAria", "Fonctionnalités principales")}>
          {FEATURES.map(({ icon: Icon, key }, index) => (
            <article key={key}>
              <span className="landing-feature-index">0{index + 1}</span>
              <Icon aria-hidden="true" />
              <h2>{t(`${key}.title`, key)}</h2>
              <p>{t(`${key}.desc`, "")}</p>
            </article>
          ))}
        </section>

        <section className="landing-final">
          <ProgressiveImage src={LANDING_FINAL_PHOTO.src} alt={LANDING_FINAL_PHOTO.alt} fill sizes="100vw" className="landing-final-image" style={{ objectPosition: LANDING_FINAL_PHOTO.position }} />
          <div className="landing-final-shade" aria-hidden="true" />
          <div><Sparkles aria-hidden="true" /><span>{t("landing.finalTag", "Coach IA + démonstrations vidéo")}</span></div>
          <h2>{t("landing.finalTitle", "Le combat se prépare avant d'entrer dans la cage.")}</h2>
          <Button size="lg" render={<Link href="/signup" />}>{t("landing.finalCta", "Créer mon espace")} <ArrowRight /></Button>
        </section>
      </main>

      <footer className="landing-footer">
        <span>MMA Mastery</span><span>{t("landing.footerTagline", "Construire. Comprendre. Maîtriser.")}</span>
        <span className="landing-footer-links">
          <Link href="/privacy">{t("legal.privacyLink", "Confidentialité")}</Link>
          <Link href="/terms">{t("legal.termsLink", "Conditions d'utilisation")}</Link>
        </span>
      </footer>
    </div>
  );
}
