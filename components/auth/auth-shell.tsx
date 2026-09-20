"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const SLIDE_DURATION = 6500;

/** Tiny neutral dark placeholder so the cover area never renders blank while a photo decodes. */
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export type Cover = {
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
  covers: coversProp,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
  hero: "static" | "rotate";
  covers?: Cover[];
}) {
  const covers = hero === "rotate" ? (coversProp ?? ROTATING_COVERS) : [STATIC_COVER];
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set());
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const { t } = useI18n();

  const nextIndex = covers.length > 1 ? (active + 1) % covers.length : active;
  // Only the active cover plus one lookahead is ever in the DOM, so the browser
  // never fetches all rotation photos at once — the next photo preloads in the
  // background for a full slide while the current one is showing.
  const mounted = nextIndex === active ? [active] : [active, nextIndex];

  const markLoaded = (index: number) =>
    setLoaded((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));

  useEffect(() => {
    if (hero !== "rotate" || covers.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => setPendingAdvance(true), SLIDE_DURATION);
    return () => window.clearInterval(interval);
  }, [hero, covers.length]);

  // Crossfade only starts once the next photo has actually decoded — the previous
  // photo stays visible until then, so the cover never shows a blank/black frame.
  useEffect(() => {
    if (!pendingAdvance || !loaded.has(nextIndex)) return;
    setActive(nextIndex);
    setPendingAdvance(false);
  }, [pendingAdvance, loaded, nextIndex]);

  const image = covers[active];

  return (
    <main className="auth-stage">
      <section className="auth-cover" aria-label={`Ambiance ${t(image.labelKey, image.label)}`}>
        {mounted.map((index) => {
          const cover = covers[index];
          return (
            <Image
              key={cover.src}
              src={cover.src}
              alt={index === active ? cover.alt : ""}
              fill
              priority={index === 0}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              onLoad={() => markLoaded(index)}
              sizes="(max-width: 767px) 100vw, 58vw"
              style={{ objectPosition: cover.position, opacity: index === active ? 1 : 0 }}
            />
          );
        })}
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
