"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const COVERS = [
  {
    src: "/mma-mastery-photos/-37DpFDYsYY7HL96ovNdzGJE1lQmDKA8d1uvLlFJJQPrLgtVmsRikjMJ7czTfs--cKYwdC1cnAasvcaLH9-swbzZpui9TP5FUMwu8tHrNVjBhXgBBPRKlIPuwePmEkdVIgxSLhRBkuHHsMOwtU-QL58nsdg6do3qQTPRTraT1zyjvNbE4Hu2t9D_36iGiBXp.jpg",
    alt: "Combattante s’entraînant dans une cage",
    label: "Cage",
    position: "62% 50%",
  },
  {
    src: "/mma-mastery-photos/pexels-cottonbro-4761790.jpg",
    alt: "Combattants s’entraînant sur un ring",
    label: "Ring",
    position: "62% 46%",
  },
] as const;

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  const [cover, setCover] = useState(0);
  useEffect(() => setCover(crypto.getRandomValues(new Uint8Array(1))[0] % COVERS.length), []);
  const image = COVERS[cover];

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
