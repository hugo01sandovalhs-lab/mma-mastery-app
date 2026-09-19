"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

const SLIDE_DURATION = 6500;

const COVERS = [
  {
    src: "/mma-mastery-photos/-37DpFDYsYY7HL96ovNdzGJE1lQmDKA8d1uvLlFJJQPrLgtVmsRikjMJ7czTfs--cKYwdC1cnAasvcaLH9-swbzZpui9TP5FUMwu8tHrNVjBhXgBBPRKlIPuwePmEkdVIgxSLhRBkuHHsMOwtU-QL58nsdg6do3qQTPRTraT1zyjvNbE4Hu2t9D_36iGiBXp.jpg",
    alt: "Combattante s'entraînant dans une cage",
    labelKey: "authCover.cage",
    label: "Cage",
    position: "62% 46%",
  },
  {
    src: "/mma-mastery-photos/pexels-cottonbro-4761790.jpg",
    alt: "Combattants s'entraînant sur un ring",
    labelKey: "authCover.ring",
    label: "Ring",
    position: "62% 46%",
  },
  {
    src: "/mma-mastery-photos/5zYAn7DilpRIqo18MtLZWFcxEEyGNSEMLHz4MzZaAPn-aWfEkVGojp3N-cJHB9-DBQspwrFJnVjOPeoVAqkzZboTryqAzsJWkgJb-_veSUnmX7NiZLkSJ_RRFgnpw0FtwaRMzun_uEendlymBwuuL8TNDc8KF3auwIwQLBIkyYAqOV4VfND_QpXjzItHjsnd.jpg",
    alt: "Combattante frappant des paos face à son coach",
    labelKey: "authCover.pads",
    label: "Paos",
    position: "50% 30%",
  },
  {
    src: "/mma-mastery-photos/WeoAGuytjpldcsH9ZheaQ0FVFkYcK3DEIfN3OjYq-QrxbYYPw7AgU47L_Kb2H8yFK-I-ozU73wVIuWaTLGwPzm4vlBplJFZYISkczYD4ufAUram7ECjqClRhzTSAU0qlOkNUf5b_Yj-iD5KJKAD3B5dnSShB6pcqD4vocmx5WJyC6LaNyZ-LTUmsDd8itTBK.jpg",
    alt: "Combattante portant un direct sur son adversaire",
    labelKey: "authCover.strike",
    label: "Frappe",
    position: "62% 32%",
  },
] as const;

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    const interval = window.setInterval(
      () => setActive((current) => (current + 1) % COVERS.length),
      SLIDE_DURATION,
    );
    return () => window.clearInterval(interval);
  }, []);

  const image = COVERS[active];

  return (
    <main className="auth-stage">
      <section className="auth-cover" aria-label={`Ambiance ${t(image.labelKey, image.label)}`}>
        {COVERS.map((cover, index) => (
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
