import { Flame, Calendar, TrendingUp, Target, Home, Dumbbell, ListChecks, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LAB_DATA } from "@/lib/design/lab-data";

const NAV = [
  { label: "Overview", icon: Home, active: true },
  { label: "Training", icon: Dumbbell },
  { label: "Skills", icon: ListChecks },
  { label: "Review", icon: RefreshCw },
];

export function FightOperations() {
  const d = LAB_DATA;
  return (
    <div className="grid grid-cols-[auto,1fr] gap-4">
      {/* Sidebar */}
      <aside className="hidden w-40 flex-col gap-1 rounded-xl border border-border bg-card p-2 sm:flex">
        <div className="mb-2 flex items-center gap-2 px-2 py-1">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Flame className="size-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-foreground">MMA MASTERY</span>
        </div>
        {NAV.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <Icon className="size-3.5" />
            {label}
          </div>
        ))}
      </aside>

      <div className="min-w-0 flex-1 space-y-3">
        {/* Header row: focus + readiness ring */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,auto]">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-1 text-xs text-muted-foreground">Good morning, {d.fighter}</div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Today&apos;s focus</div>
              <div className="mb-3 text-base font-bold text-foreground">{d.focus}</div>
              <Button size="sm">Start session</Button>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center gap-1 p-4">
              <div
                className="flex size-16 items-center justify-center rounded-full text-sm font-bold text-foreground"
                style={{
                  background: `conic-gradient(var(--primary) ${d.readiness * 3.6}deg, var(--muted) 0deg)`,
                }}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-card">{d.readiness}</span>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Readiness</span>
            </CardContent>
          </Card>
        </div>

        {/* Skill metrics grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {d.skills.map((s) => (
            <Card key={s.name} className="border-border bg-card">
              <CardContent className="p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.name}</div>
                <div className="text-lg font-bold text-foreground">{s.value}%</div>
                <div className="text-[10px] text-primary">{s.trend}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load chart + progression */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="border-border bg-card lg:col-span-2">
            <CardContent className="p-4">
              <div className="mb-2 text-xs font-semibold text-foreground">Charge — 7 derniers jours</div>
              <div className="flex h-24 items-end gap-1.5">
                {d.weekBars.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${h}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="space-y-2 p-4">
              <div className="text-xs font-semibold text-foreground">Stats</div>
              <div className="flex items-center gap-2 text-xs">
                <Flame className="size-3.5 text-primary" />
                <span className="text-foreground">{d.streakDays}j streak</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="size-3.5 text-primary" />
                <span className="text-foreground">{d.sessionsTotal} sessions</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="size-3.5 text-primary" />
                <span className="text-foreground">{d.masteryAvg}% mastery avg</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Target className="size-3.5 text-primary" />
                <span className="text-foreground">{d.activeGoals} goals actifs</span>
                <Badge variant="secondary" className="ml-auto">live</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
