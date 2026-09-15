// Design Lab theme registry — single source of truth for /design.
// Each theme overrides shadcn's CSS custom properties (colors) plus a
// small set of `--lab-*` layout tokens (density, radius, motion) that each
// direction's own layout component consumes. Structural differences (nav
// shape, hero, typography scale, card density) live in the direction
// components themselves — colors alone do not make 6 directions distinct.

export type DesignThemeId =
  | "fight-operations"
  | "championship"
  | "athlete-editorial"
  | "fight-academy"
  | "fight-science"
  | "fight-journal";

export interface DesignTheme {
  id: DesignThemeId;
  name: string;
  tagline: string;
  vars: Record<string, string>;
}

export const DESIGN_THEMES: DesignTheme[] = [
  {
    id: "fight-operations",
    name: "Fight Operations",
    tagline: "Le cockpit du combattant professionnel. Dark, dense, contrôle.",
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
      "--lab-card-padding": "1rem",
      "--lab-gap": "0.65rem",
      "--lab-heading-weight": "700",
      "--lab-heading-tracking": "-0.01em",
      "--lab-transition": "120ms ease",
      "--lab-hover-scale": "1.01",
      "--lab-font": "sans-serif",
    },
  },
  {
    id: "championship",
    name: "Championship",
    tagline: "Excellence / Prestige / Focus. Camp premium, crème et or.",
    vars: {
      "--background": "oklch(0.97 0.015 75)",
      "--foreground": "oklch(0.18 0.01 60)",
      "--card": "oklch(0.995 0.006 75)",
      "--card-foreground": "oklch(0.18 0.01 60)",
      "--popover": "oklch(0.995 0.006 75)",
      "--popover-foreground": "oklch(0.18 0.01 60)",
      "--primary": "oklch(0.72 0.13 80)",
      "--primary-foreground": "oklch(0.16 0.02 60)",
      "--secondary": "oklch(0.93 0.02 75)",
      "--secondary-foreground": "oklch(0.18 0.01 60)",
      "--muted": "oklch(0.93 0.02 75)",
      "--muted-foreground": "oklch(0.5 0.02 60)",
      "--accent": "oklch(0.93 0.02 75)",
      "--accent-foreground": "oklch(0.18 0.01 60)",
      "--border": "oklch(0.88 0.02 70)",
      "--input": "oklch(0.88 0.02 70)",
      "--ring": "oklch(0.72 0.13 80)",
      "--radius": "1rem",
      "--lab-card-padding": "1.4rem",
      "--lab-gap": "1.1rem",
      "--lab-heading-weight": "800",
      "--lab-heading-tracking": "-0.01em",
      "--lab-transition": "180ms ease",
      "--lab-hover-scale": "1.01",
      "--lab-font": "sans-serif",
    },
  },
  {
    id: "athlete-editorial",
    name: "Athlete Editorial",
    tagline: "Inspiration Apple Fitness+. Lumineux, spacieux, une idée par bloc.",
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
      "--muted": "oklch(0.97 0 0)",
      "--muted-foreground": "oklch(0.5 0 0)",
      "--accent": "oklch(0.7 0.15 200)",
      "--accent-foreground": "oklch(0.15 0 0)",
      "--border": "oklch(0.94 0 0)",
      "--input": "oklch(0.93 0 0)",
      "--ring": "oklch(0.62 0.24 340)",
      "--radius": "1.5rem",
      "--lab-card-padding": "2rem",
      "--lab-gap": "1.75rem",
      "--lab-heading-weight": "600",
      "--lab-heading-tracking": "-0.03em",
      "--lab-transition": "300ms ease",
      "--lab-hover-scale": "1.01",
      "--lab-font": "sans-serif",
    },
  },
  {
    id: "fight-academy",
    name: "Fight Academy",
    tagline: "L'université personnelle du MMA. Structure, relations, progrès.",
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
      "--lab-card-padding": "1.1rem",
      "--lab-gap": "1rem",
      "--lab-heading-weight": "600",
      "--lab-heading-tracking": "0em",
      "--lab-transition": "120ms ease",
      "--lab-hover-scale": "1",
      "--lab-font": "sans-serif",
    },
  },
  {
    id: "fight-science",
    name: "Fight Science",
    tagline: "La donnée au service de ta progression. Inspiration WHOOP/Oura.",
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
      "--radius": "0.6rem",
      "--lab-card-padding": "1.1rem",
      "--lab-gap": "0.85rem",
      "--lab-heading-weight": "600",
      "--lab-heading-tracking": "-0.01em",
      "--lab-transition": "200ms ease",
      "--lab-hover-scale": "1.01",
      "--lab-font": "sans-serif",
    },
  },
  {
    id: "fight-journal",
    name: "Fight Journal",
    tagline: "Ton carnet de combat, jour après jour. Humain, personnel, éditorial.",
    vars: {
      "--background": "oklch(0.94 0.015 75)",
      "--foreground": "oklch(0.2 0.02 60)",
      "--card": "oklch(0.985 0.01 80)",
      "--card-foreground": "oklch(0.2 0.02 60)",
      "--popover": "oklch(0.985 0.01 80)",
      "--popover-foreground": "oklch(0.2 0.02 60)",
      "--primary": "oklch(0.32 0.05 40)",
      "--primary-foreground": "oklch(0.98 0.01 80)",
      "--secondary": "oklch(0.9 0.02 75)",
      "--secondary-foreground": "oklch(0.25 0.02 60)",
      "--muted": "oklch(0.9 0.02 75)",
      "--muted-foreground": "oklch(0.45 0.02 60)",
      "--accent": "oklch(0.55 0.15 35)",
      "--accent-foreground": "oklch(0.98 0.01 80)",
      "--border": "oklch(0.85 0.02 70)",
      "--input": "oklch(0.85 0.02 70)",
      "--ring": "oklch(0.55 0.15 35)",
      "--radius": "0.4rem",
      "--lab-card-padding": "1.5rem",
      "--lab-gap": "1.1rem",
      "--lab-heading-weight": "600",
      "--lab-heading-tracking": "0em",
      "--lab-transition": "150ms ease",
      "--lab-hover-scale": "1",
      "--lab-font": "serif",
    },
  },
];

export const DEFAULT_DESIGN_THEME: DesignThemeId = "fight-operations";

export function generateThemeCss(): string {
  return DESIGN_THEMES.map((theme) => {
    const decls = Object.entries(theme.vars)
      .map(([k, v]) => `${k}:${v};`)
      .join("");
    return `[data-fight-theme="${theme.id}"]{${decls}}`;
  }).join("\n");
}
