"use client";

import Image from "next/image";
import { LANDING_SLIDES } from "@/lib/design/photography";

const HERO = LANDING_SLIDES[0];

export function LandingHero() {
  return (
    <div className="landing-visual" aria-label="Entraînements MMA">
      <Image
        src={HERO.src}
        alt={HERO.alt}
        fill
        priority
        quality={90}
        sizes="100vw"
        className="landing-visual-image"
        style={{ objectPosition: HERO.position }}
      />
    </div>
  );
}
