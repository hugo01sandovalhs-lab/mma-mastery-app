"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LANDING_SLIDES } from "@/lib/design/photography";

const SLIDE_DURATION = 6500;

export function LandingHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(Math.floor(Math.random() * LANDING_SLIDES.length));
    const interval = window.setInterval(
      () => setActive((current) => (current + 1) % LANDING_SLIDES.length),
      SLIDE_DURATION,
    );
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="landing-visual" aria-label="Entraînements MMA">
      {LANDING_SLIDES.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={index === active ? slide.alt : ""}
          fill
          priority={index === 0}
          sizes="(max-width: 767px) 100vw, 56vw"
          className="landing-visual-image"
          style={{ objectPosition: slide.position, opacity: index === active ? 1 : 0 }}
        />
      ))}
      <div className="landing-slide-count" aria-hidden="true">
        <span>{String(active + 1).padStart(2, "0")}</span>
        <span>{String(LANDING_SLIDES.length).padStart(2, "0")}</span>
      </div>
      <div className="landing-progress" aria-hidden="true">
        {LANDING_SLIDES.map((slide, index) => (
          <span key={slide.src} className={index === active ? "is-active" : ""}>
            <i key={`${active}-${index}`} style={{ animationDuration: `${SLIDE_DURATION}ms` }} />
          </span>
        ))}
      </div>
    </div>
  );
}
