"use client";

import Image from "next/image";
import Link from "next/link";

const COVER = {
  src: "/mma-mastery-photos/pexels-cottonbro-4761790.jpg",
  alt: "Combattants s’entraînant sur un ring",
  label: "Ring",
  position: "62% 46%",
} as const;

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  const image = COVER;

  return (
    <main className="auth-stage">
      <section className="auth-cover" aria-label={`Ambiance ${image.label}`}>
        <Image src={image.src} alt={image.alt} fill priority sizes="(max-width: 767px) 100vw, 58vw" style={{ objectPosition: image.position }} />
        <Link href="/" className="auth-brand" aria-label="MMA Mastery, accueil">
          <span>MM</span> MMA Mastery
        </Link>
        <div className="auth-cover-copy">
          <p>{image.label}</p>
          <strong>Chaque round compte.</strong>
          <span>Documentez le travail. Mesurez la progression. Revenez plus fort.</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
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
