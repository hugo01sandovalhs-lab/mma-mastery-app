"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LANDING_SLIDES } from "@/lib/design/photography";
import { useI18n } from "@/components/i18n-provider";

const SLIDE_DURATION = 6500;

export function LandingHero() {
  const [active, setActive] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    const interval = window.setInterval(
      () => setActive((current) => (current + 1) % LANDING_SLIDES.length),
      SLIDE_DURATION,
    );
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="landing-visual" aria-label={t("landing.heroAria", "Entraînements MMA")}>
      {LANDING_SLIDES.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={index === active ? slide.alt : ""}
          fill
          priority={index === 0}
          quality={90}
          sizes="100vw"
          className="landing-visual-image"
          style={{ objectPosition: slide.position, opacity: index === active ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
