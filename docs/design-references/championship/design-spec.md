# Championship — Design Spec

Source: `docs/design-references/championship/00-reference.png`. Championship direction only — do not mix Fight Operations (dark cockpit) or Fight Journal (editorial/serif) cues.

## Visual identity

Light, warm, prestige-driven. Cream/off-white surfaces, gold accent, one dark "hero" surface per screen for drama. Reads as a premium fight-camp program, not a dark ops dashboard.

## Palette

| Token | Role | Value (oklch) |
|---|---|---|
| `--background` | page bg, warm cream | `oklch(0.97 0.015 75)` |
| `--foreground` | body text, near-black warm | `oklch(0.18 0.01 60)` |
| `--card` | card surface, warm white | `oklch(0.995 0.006 75)` |
| `--card-foreground` | card text | `oklch(0.18 0.01 60)` |
| `--primary` | gold accent | `oklch(0.72 0.13 80)` |
| `--primary-foreground` | text on gold | `oklch(0.16 0.02 60)` |
| `--secondary` / `--muted` | soft cream fill | `oklch(0.93 0.02 75)` |
| `--muted-foreground` | secondary text | `oklch(0.5 0.02 60)` |
| `--border` | hairline | `oklch(0.88 0.02 70)` |
| `--sidebar` | sidebar surface | same as `--card` (cream, not gray) |
| hero surface | dark, not a token — local override | `oklch(0.16 0 0)` bg, gold headline text |

No blue, no neon. Gold is the only saturated color; used sparingly (active nav, ring progress, headline accents, primary buttons).

## Typography

Sans-serif throughout. Headings: extrabold/black weight, tight tracking, uppercase for hero headline only (not body headings). Numbers (percentages, stats) get heavier weight than surrounding label text. Labels/eyebrows: small, uppercase, muted, letter-spaced.

## Surfaces

Two surface types only:
1. **Cream surfaces** — sidebar, page background, default cards. Flat, minimal shadow.
2. **Dark hero surface** — one per page, high contrast, gold text on near-black. Never repeated for regular cards.

## Spacing

Generous padding inside cards (`1.25–1.5rem`). Consistent gap between cards (`1rem`–`1.25rem`). Sidebar items use comfortable vertical rhythm, not dense.

## Borders / radius / shadows

Large radius throughout — `1rem`+ on cards, hero, and sidebar active-state pill. Hairline `1px` borders in cream tones, no heavy outlines. Shadows are soft and shallow (`shadow-sm`-level), never dramatic drop shadows — depth comes from surface contrast (cream vs. dark hero), not shadow.

## Navigation

Left sidebar, fixed width, cream background, no border needed against cream page bg (or a hairline only). Top: wordmark + small badge/logo mark. Nav items: icon + label, vertical list, generous spacing. Active item: gold pill/background behind icon+label, no left-border accent (that's Fight Operations' language). Inactive items: muted text, no icon color.

## Hero composition

Full-width dark panel, rounded corners, sits directly below/beside nav at top of main content. Large bold headline (2–3 short lines, uppercase), gold-tinted or white text. No literal photo asset — approximate the mood with a dark gradient/vignette, never the reference PNG itself as background. Small utility icon row top-right is optional decoration, skip if it adds no function.

## Cards

Flat cream cards, rounded-2xl, title as small muted eyebrow label + one dominant value/line below. Card content is sparse — one idea per card (today's focus, next session, global progress). Avoid stacking many secondary lines inside a metric card.

## Metrics / progression

Primary progress metric = circular ring (gold stroke, muted track), bold percentage centered. Secondary progress (weekly bars, mastery stages) can stay linear bars, gold fill on muted track, consistent with the ring's gold-on-muted language.

## Imagery

None required. The PNG is a compositional reference only, never embedded as an asset/background in the app.

## Hierarchy

Order of visual weight: hero headline > ring/percentage metrics > card eyebrow+value > list rows > nav labels. Only one gold-saturated focal point should dominate per screen (usually the hero or the main ring, not both competing at max weight).

## Desktop / mobile rules

- **Desktop**: persistent left sidebar + hero spanning remaining width; metric cards in a 3-column row below hero; activity/progression below that.
- **Mobile**: sidebar collapses (existing app bottom-nav pattern, unchanged); hero stacks full-width above cards; cards go single column; ring metrics stay prominent, sized down but never below legible label size.

## DO

- Keep gold as the single accent color.
- Keep exactly one dark hero surface per screen.
- Use large radius and soft shadow consistently.
- Keep card content to one dominant idea each.

## DON'T

- Don't use the dark cockpit palette (Fight Operations) or serif/editorial journal styling (Fight Journal) anywhere in this direction.
- Don't embed the reference PNG or any photo as a background/asset.
- Don't add a second dark surface competing with the hero.
- Don't add left-border accent bars to cards (that's another direction's language).
- Don't invent data — wire to real existing data sources when applying these components to real pages.
