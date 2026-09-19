"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-xl font-semibold tracking-tight">{t("error.genericTitle", "Une erreur est survenue")}</h1>
      <p className="text-muted-foreground max-w-md text-sm">{error.message}</p>
      <Button onClick={reset}>{t("offline.cta", "Réessayer")}</Button>
    </div>
  );
}
