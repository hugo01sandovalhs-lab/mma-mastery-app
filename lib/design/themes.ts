// Design Lab theme registry — single source of truth for /design.
// Each theme overrides shadcn's CSS custom properties (colors) plus a
// small set of `--lab-*` layout tokens (density, radius, motion) that the
// showcase markup consumes directly. No app code depends on this file.

export type DesignThemeId =
  | "fight-lab"
  | "fitness-pro"
  | "linear-fight"
  | "performance-data"
  | "championship"
  | "technical-academy";

export interface DesignTheme {
  id: DesignThemeId;
  name: string;
  tagline: string;
  vars: Record<string, string>;
}

export const DESIGN_THEMES: DesignTheme[] = [
  {
    id: "fight-lab",
    name: "Fight Lab",
    tagline: "Dark, premium, combat. Noir / rouge-orange, dense mais lisible.",
    vars: {
      "--background": "oklch(0.145 0 0)",
      "--foreground": "oklch(0.96 0 0)",
      "--card": "oklch(0.19 0.01 30)",
      "--card-foreground": "oklch(0.96 0 0)",
      "--popover": "oklch(0.19 0.01 30)",
      "--popover-foreground": "oklch(0.96 0 0)",
      "--primary": "oklch(0.63 0.22 29)",
      "--primary-foreground": "oklch(0.98 0 0)",
      "--secondary": "oklch(0.25 0.02 30)",
      "--secondary-foreground": "oklch(0.96 0 0)",
      "--muted": "oklch(0.22 0 0)",
      "--muted-foreground": "oklch(0.65 0 0)",
      "--accent": "oklch(0.63 0.22 29)",
      "--accent-foreground": "oklch(0.98 0 0)",
      "--border": "oklch(0.28 0 0)",
      "--input": "oklch(0.28 0 0)",
      "--ring": "oklch(0.63 0.22 29)",
      "--radius": "0.5rem",
      "--lab-card-padding": "1.1rem",
      "--lab-gap": "0.75rem",
      "--lab-heading-weight": "700",
      "--lab-heading-tracking": "-0.01em",
      "--lab-transition": "150ms ease",
      "--lab-hover-scale": "1.01",
    },
  },
  {
    id: "fitness-pro",
    name: "Fitness Pro",
    tagline: "Inspiration Apple Fitness+. Lumineux, grandes métriques, espace.",
    vars: {
      "--background": "oklch(0.99 0 0)",
      "--foreground": "oklch(0.15 0 0)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.15 0 0)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.15 0 0)",
      "--primary": "oklch(0.62 0.24 340)",
      "--primary-foreground": "oklch(0.99 0 0)",
      "--secondary": "oklch(0.96 0.02 340)",
      "--secondary-foreground": "oklch(0.25 0 0)",
      "--muted": "oklch(0.96 0 0)",
      "--muted-foreground": "oklch(0.5 0 0)",
      "--accent": "oklch(0.7 0.15 200)",
      "--accent-foreground": "oklch(0.15 0 0)",
      "--border": "oklch(0.93 0 0)",
      "--input": "oklch(0.93 0 0)",
      "--ring": "oklch(0.62 0.24 340)",
      "--radius": "1.25rem",
      "--lab-card-padding": "1.75rem",
      "--lab-gap": "1.5rem",
      "--lab-heading-weight": "600",
      "--lab-heading-tracking": "-0.02em",
      "--lab-transition": "300ms ease",
      "--lab-hover-scale": "1.02",
    },
  },
  {
    id: "linear-fight",
    name: "Linear Fight",
    tagline: "Ultra minimal, dark, précision. Typographie forte, faible bruit.",
    vars: {
      "--background": "oklch(0.12 0 0)",
      "--foreground": "oklch(0.95 0 0)",
      "--card": "oklch(0.15 0 0)",
      "--card-foreground": "oklch(0.95 0 0)",
      "--popover": "oklch(0.15 0 0)",
      "--popover-foreground": "oklch(0.95 0 0)",
      "--primary": "oklch(0.95 0 0)",
      "--primary-foreground": "oklch(0.12 0 0)",
      "--secondary": "oklch(0.18 0 0)",
      "--secondary-foreground": "oklch(0.95 0 0)",
      "--muted": "oklch(0.18 0 0)",
      "--muted-foreground": "oklch(0.55 0 0)",
      "--accent": "oklch(0.55 0.18 260)",
      "--accent-foreground": "oklch(0.98 0 0)",
      "--border": "oklch(0.22 0 0)",
      "--input": "oklch(0.22 0 0)",
      "--ring": "oklch(0.55 0.18 260)",
      "--radius": "0.25rem",
      "--lab-card-padding": "1rem",
      "--lab-gap": "0.5rem",
      "--lab-heading-weight": "600",
      "--lab-heading-tracking": "-0.015em",
      "--lab-transition": "80ms linear",
      "--lab-hover-scale": "1",
    },
  },
  {
    id: "performance-data",
    name: "Performance Data",
    tagline: "Inspiration Oura/WHOOP. Dashboards, tendances, coaching data.",
    vars: {
      "--background": "oklch(0.16 0.02 260)",
      "--foreground": "oklch(0.95 0 0)",
      "--card": "oklch(0.20 0.02 260)",
      "--card-foreground": "oklch(0.95 0 0)",
      "--popover": "oklch(0.20 0.02 260)",
      "--popover-foreground": "oklch(0.95 0 0)",
      "--primary": "oklch(0.75 0.15 190)",
      "--primary-foreground": "oklch(0.12 0.02 260)",
      "--secondary": "oklch(0.25 0.02 260)",
      "--secondary-foreground": "oklch(0.95 0 0)",
      "--muted": "oklch(0.24 0.02 260)",
      "--muted-foreground": "oklch(0.65 0.02 260)",
      "--accent": "oklch(0.8 0.18 90)",
      "--accent-foreground": "oklch(0.12 0.02 260)",
      "--border": "oklch(0.28 0.02 260)",
      "--input": "oklch(0.28 0.02 260)",
      "--ring": "oklch(0.75 0.15 190)",
      "--radius": "0.75rem",
      "--lab-card-padding": "1.4rem",
      "--lab-gap": "1rem",
      "--lab-heading-weight": "600",
      "--lab-heading-tracking": "-0.01em",
      "--lab-transition": "200ms ease",
      "--lab-hover-scale": "1.015",
    },
  },
  {
    id: "championship",
    name: "Championship",
    tagline: "Sportif, énergique, compétition. Badges et statuts, expressif.",
    vars: {
      "--background": "oklch(0.13 0 0)",
      "--foreground": "oklch(0.97 0 0)",
      "--card": "oklch(0.17 0.01 80)",
      "--card-foreground": "oklch(0.97 0 0)",
      "--popover": "oklch(0.17 0.01 80)",
      "--popover-foreground": "oklch(0.97 0 0)",
      "--primary": "oklch(0.78 0.16 85)",
      "--primary-foreground": "oklch(0.12 0 0)",
      "--secondary": "oklch(0.22 0.01 80)",
      "--secondary-foreground": "oklch(0.97 0 0)",
      "--muted": "oklch(0.22 0.01 80)",
      "--muted-foreground": "oklch(0.65 0 0)",
      "--accent": "oklch(0.55 0.2 25)",
      "--accent-foreground": "oklch(0.98 0 0)",
      "--border": "oklch(0.3 0.02 80)",
      "--input": "oklch(0.3 0.02 80)",
      "--ring": "oklch(0.78 0.16 85)",
      "--radius": "0.9rem",
      "--lab-card-padding": "1.3rem",
      "--lab-gap": "1rem",
      "--lab-heading-weight": "800",
      "--lab-heading-tracking": "0em",
      "--lab-transition": "180ms ease",
      "--lab-hover-scale": "1.03",
    },
  },
  {
    id: "technical-academy",
    name: "Technical Academy",
    tagline: "Inspiration documentation. Lisible, noir/blanc, priorité au contenu.",
    vars: {
      "--background": "oklch(1 0 0)",
      "--foreground": "oklch(0.12 0 0)",
      "--card": "oklch(0.995 0 0)",
      "--card-foreground": "oklch(0.12 0 0)",
      "--popover": "oklch(0.995 0 0)",
      "--popover-foreground": "oklch(0.12 0 0)",
      "--primary": "oklch(0.15 0 0)",
      "--primary-foreground": "oklch(1 0 0)",
      "--secondary": "oklch(0.96 0 0)",
      "--secondary-foreground": "oklch(0.15 0 0)",
      "--muted": "oklch(0.96 0 0)",
      "--muted-foreground": "oklch(0.45 0 0)",
      "--accent": "oklch(0.4 0.1 250)",
      "--accent-foreground": "oklch(0.99 0 0)",
      "--border": "oklch(0.9 0 0)",
      "--input": "oklch(0.9 0 0)",
      "--ring": "oklch(0.4 0.1 250)",
      "--radius": "0.375rem",
      "--lab-card-padding": "1.5rem",
      "--lab-gap": "1.25rem",
      "--lab-heading-weight": "600",
      "--lab-heading-tracking": "0em",
      "--lab-transition": "120ms ease",
      "--lab-hover-scale": "1",
    },
  },
];

export const DEFAULT_DESIGN_THEME: DesignThemeId = "fight-lab";

export function generateThemeCss(): string {
  return DESIGN_THEMES.map((theme) => {
    const decls = Object.entries(theme.vars)
      .map(([k, v]) => `${k}:${v};`)
      .join("");
    return `[data-fight-theme="${theme.id}"]{${decls}}`;
  }).join("\n");
}
