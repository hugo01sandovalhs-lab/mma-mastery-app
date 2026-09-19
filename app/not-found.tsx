"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-xl font-semibold tracking-tight">{t("notFound.title", "Page introuvable")}</h1>
      <p className="text-sm text-muted-foreground">{t("notFound.body", "Cette page n'existe pas ou plus.")}</p>
      <Button render={<Link href="/" />}>{t("notFound.cta", "Retour à l'accueil")}</Button>
    </div>
  );
}
