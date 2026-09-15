"use client";

// TEMPORARY — comparison tool, safe to delete. Lets any real page preview a
// Design Lab direction via ?theme=<id> without touching business logic.
// Revert: remove <ThemeLabOverride /> from app/layout.tsx and delete this file.

import { useEffect } from "react";
import { DESIGN_THEMES, generateThemeCss, type DesignThemeId } from "./themes";

const STYLE_ID = "design-lab-preview-style";

function isThemeId(value: string | null): value is DesignThemeId {
  return DESIGN_THEMES.some((t) => t.id === value);
}

export function ThemeLabOverride() {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("theme");
    if (!isThemeId(id)) return;

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = generateThemeCss();
    document.documentElement.setAttribute("data-fight-theme", id);

    return () => {
      document.documentElement.removeAttribute("data-fight-theme");
    };
  }, []);

  return null;
}
