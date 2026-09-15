"use client";

import { useEffect, useState } from "react";
import { DESIGN_THEMES, DEFAULT_DESIGN_THEME, type DesignThemeId } from "@/lib/design/themes";
import { DIRECTION_COMPONENTS } from "./directions";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mma-design-lab-theme";

function isThemeId(value: string | null): value is DesignThemeId {
  return DESIGN_THEMES.some((t) => t.id === value);
}

export function DesignLabClient() {
  const [active, setActive] = useState<DesignThemeId>(DEFAULT_DESIGN_THEME);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemeId(stored)) setActive(stored);
  }, []);

  function select(id: DesignThemeId) {
    setActive(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  const theme = DESIGN_THEMES.find((t) => t.id === active) ?? DESIGN_THEMES[0];
  const Direction = DIRECTION_COMPONENTS[active];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {DESIGN_THEMES.map((t) => (
          <Button
            key={t.id}
            type="button"
            size="sm"
            variant={active === t.id ? "default" : "outline"}
            onClick={() => select(t.id)}
          >
            {t.name}
          </Button>
        ))}
      </div>
      <p className="mb-4 text-xs text-neutral-500">{theme.tagline}</p>
      <div
        data-fight-theme={active}
        className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-background p-4 sm:p-6"
        style={{ fontFamily: "var(--lab-font)" }}
      >
        <Direction />
      </div>
    </>
  );
}
