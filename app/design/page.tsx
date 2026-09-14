import type { Metadata } from "next";
import { DESIGN_THEMES, generateThemeCss } from "@/lib/design/themes";
import { ThemeSwitcher } from "./theme-switcher";
import { Showcase } from "./showcase";

export const metadata: Metadata = {
  title: "Design Lab — MMA Mastery",
  description: "Comparaison des directions graphiques V3 avant décision finale.",
};

const LAB_ID = "design-lab-surface";

export default function DesignLabPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: generateThemeCss() }} />
      <div className="min-h-screen bg-neutral-950 p-4 sm:p-8">
        <div className="mx-auto mb-6 max-w-5xl">
          <h1 className="mb-1 text-xl font-semibold text-white">Design Lab</h1>
          <p className="mb-4 text-sm text-neutral-400">
            6 directions graphiques V3 sur les mêmes composants. Choix visuel non figé —
            switch ci-dessous, persisté localement.
          </p>
          <ThemeSwitcher targetId={LAB_ID} />
        </div>
        <div
          id={LAB_ID}
          data-fight-theme={DESIGN_THEMES[0].id}
          className="mx-auto max-w-5xl rounded-2xl bg-background p-4 sm:p-6"
        >
          <Showcase />
        </div>
      </div>
    </>
  );
}
