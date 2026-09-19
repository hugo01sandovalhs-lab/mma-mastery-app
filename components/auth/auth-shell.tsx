"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const SLIDE_DURATION = 6500;

type Cover = {
  src: string;
  alt: string;
  labelKey: string;
  label: string;
  position: string;
};

const STATIC_COVER: Cover = {
  src: "/mma-mastery-photos/hero-white-gloves-cage.jpg",
  alt: "Combattant en garde, gants blancs levés, dans une cage à l'éclairage dramatique",
  labelKey: "authCover.ring",
  label: "Ring",
  position: "50% 34%",
};

const ROTATING_COVERS: Cover[] = [
  {
    src: "/mma-mastery-photos/rotation-heavybag-back.jpg",
    alt: "Combattante travaillant au sac, vue de dos",
    labelKey: "authCover.bag",
    label: "Sac",
    position: "50% 28%",
  },
  {
    src: "/mma-mastery-photos/rotation-corner-embrace.jpg",
    alt: "Deux combattants échangeant dans un coin de salle",
    labelKey: "authCover.corner",
    label: "Coin",
    position: "50% 30%",
  },
  {
    src: "/mma-mastery-photos/rotation-heavybag-laugh.jpg",
    alt: "Combattante souriante face au sac lourd",
    labelKey: "authCover.energy",
    label: "Énergie",
    position: "50% 38%",
  },
  {
    src: "/mma-mastery-photos/rotation-ring-jab.jpg",
    alt: "Boxeur portant un direct sur le ring",
    labelKey: "authCover.strike",
    label: "Frappe",
    position: "40% 36%",
  },
];

export function AuthShell({
  title,
  intro,
  children,
  hero,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
  hero: "static" | "rotate";
}) {
  const covers = hero === "rotate" ? ROTATING_COVERS : [STATIC_COVER];
  const [active, setActive] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    if (hero !== "rotate") return;
    const interval = window.setInterval(
      () => setActive((current) => (current + 1) % covers.length),
      SLIDE_DURATION,
    );
    return () => window.clearInterval(interval);
  }, [hero, covers.length]);

  const image = covers[active];

  return (
    <main className="auth-stage">
      <section className="auth-cover" aria-label={`Ambiance ${t(image.labelKey, image.label)}`}>
        {covers.map((cover, index) => (
          <Image
            key={cover.src}
            src={cover.src}
            alt={index === active ? cover.alt : ""}
            fill
            priority={index === 0}
            sizes="(max-width: 767px) 100vw, 58vw"
            style={{ objectPosition: cover.position, opacity: index === active ? 1 : 0 }}
          />
        ))}
        <Link href="/" className="auth-brand" aria-label="MMA Mastery, accueil">
          <span>MM</span> MMA Mastery
        </Link>
        <div className="auth-cover-copy">
          <p>{t(image.labelKey, image.label)}</p>
          <strong>{t("auth.shell.tagline", "Chaque round compte.")}</strong>
          <span>{t("auth.shell.taglineBody", "Documentez le travail. Mesurez la progression. Revenez plus fort.")}</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-panel-top">
            <LanguageSwitcher />
          </div>
          <div className="auth-heading">
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
