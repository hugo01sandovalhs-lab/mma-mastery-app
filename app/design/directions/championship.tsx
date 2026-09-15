import { LayoutDashboard, Dumbbell, Target, Sparkles, TrendingUp, Users, BookOpen, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChampionshipSidebar, type ChampionshipNavItem } from "@/components/championship/sidebar";
import { ChampionshipHero } from "@/components/championship/hero";
import { ChampionshipMetricCard } from "@/components/championship/metric-card";
import { LAB_DATA } from "@/lib/design/lab-data";

const NAV_ITEMS: ChampionshipNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/skills", label: "Skills", icon: Target },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/progression", label: "Progression", icon: TrendingUp },
  { href: "/club", label: "Club", icon: Users },
  { href: "/study", label: "Knowledge", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Championship() {
  const d = LAB_DATA;

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <ChampionshipSidebar items={NAV_ITEMS} activeHref="/dashboard" wordmark="MMA MASTERY" />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <ChampionshipHero eyebrow={d.camp.name.split(" — ")[0]} headline="Discipline builds champions">
          <p className="max-w-sm text-sm text-[oklch(0.85_0.01_80)]">
            Day {d.camp.day} / {d.camp.totalDays} · {d.streakDays} day streak
          </p>
        </ChampionshipHero>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ChampionshipMetricCard eyebrow="Focus du jour" value={d.todaySession.skill} />
          <ChampionshipMetricCard
            eyebrow="Prochaine séance"
            value={`${d.camp.milestone} · ${d.camp.milestoneProgress}`}
          />
          <ChampionshipMetricCard eyebrow="Progression globale" ring={d.readiness} />
        </div>

        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dernières activités
            </div>
            <ul className="flex flex-col gap-2.5">
              {d.recentEntries.map((entry) => (
                <li key={entry.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{entry.label}</span>
                  <Badge variant="outline" className="shrink-0 rounded-full border-border text-muted-foreground">
                    {entry.date}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
