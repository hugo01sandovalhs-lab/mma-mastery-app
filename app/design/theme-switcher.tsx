"use client";

import { useEffect, useState } from "react";
import { DESIGN_THEMES, DEFAULT_DESIGN_THEME, type DesignThemeId } from "@/lib/design/themes";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "mma-design-lab-theme";

function isThemeId(value: string | null): value is DesignThemeId {
  return DESIGN_THEMES.some((t) => t.id === value);
}

export function ThemeSwitcher({ targetId }: { targetId: string }) {
  const [active, setActive] = useState<DesignThemeId>(DEFAULT_DESIGN_THEME);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const next = isThemeId(stored) ? stored : DEFAULT_DESIGN_THEME;
    setActive(next);
    document.getElementById(targetId)?.setAttribute("data-fight-theme", next);
  }, [targetId]);

  function select(id: DesignThemeId) {
    setActive(id);
    localStorage.setItem(STORAGE_KEY, id);
    document.getElementById(targetId)?.setAttribute("data-fight-theme", id);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DESIGN_THEMES.map((theme) => (
        <Button
          key={theme.id}
          type="button"
          size="sm"
          variant={active === theme.id ? "default" : "outline"}
          onClick={() => select(theme.id)}
        >
          {theme.name}
        </Button>
      ))}
    </div>
  );
}
