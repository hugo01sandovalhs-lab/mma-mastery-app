import type { Metadata } from "next";
import { generateThemeCss } from "@/lib/design/themes";
import { DesignLabClient } from "./design-lab-client";

export const metadata: Metadata = {
  title: "Design Lab — MMA Mastery",
  description: "6 directions graphiques V3 réellement distinctes, mêmes données.",
};

export default function DesignLabPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: generateThemeCss() }} />
      <div className="min-h-screen bg-neutral-950 p-4 sm:p-8">
        <div className="mx-auto mb-6 max-w-5xl">
          <h1 className="mb-1 text-xl font-semibold text-white">Design Lab</h1>
          <p className="mb-4 text-sm text-neutral-400">
            6 directions graphiques V3 sur les mêmes données et composants métier.
            Choix visuel non figé — switch ci-dessous, persisté localement.
          </p>
        </div>
        <div className="mx-auto max-w-5xl">
          <DesignLabClient />
        </div>
      </div>
    </>
  );
}
