import { Flame, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LAB_DATA } from "@/lib/design/lab-data";

export function Championship() {
  const d = LAB_DATA;
  const pct = Math.round((d.camp.day / d.camp.totalDays) * 100);
  return (
    <div className="space-y-3">
      {/* Top nav */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" />
          <span className="text-sm font-extrabold tracking-tight text-foreground">MMA MASTERY</span>
        </div>
        <div className="hidden gap-4 text-xs text-muted-foreground sm:flex">
          <span className="text-foreground">Home</span>
          <span>Train</span>
          <span>Learn</span>
          <span>Progress</span>
        </div>
      </div>

      {/* Hero camp banner */}
      <Card className="overflow-hidden border-border bg-gradient-to-br from-card to-secondary">
        <CardContent className="p-6">
          <Badge className="mb-3">{d.camp.name.split(" — ")[0].toUpperCase()}</Badge>
          <h2 className="mb-1 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            Build the complete fighter
          </h2>
          <div className="mb-3 text-sm font-medium text-muted-foreground">
            Day {d.camp.day} / {d.camp.totalDays}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Today's session */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Today&apos;s session</div>
            <div className="mb-3 text-lg font-bold text-foreground">{d.todaySession.skill} · {d.todaySession.minutes}min</div>
            <Button className="w-full">Start</Button>
          </CardContent>
        </Card>

        {/* Milestone */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Next milestone</div>
            <div className="mb-1 text-lg font-bold text-foreground">{d.camp.milestone}</div>
            <Badge variant="secondary">{d.camp.milestoneProgress}</Badge>
          </CardContent>
        </Card>

        {/* Quote */}
        <Card className="border-border bg-secondary">
          <CardContent className="flex h-full items-center p-4">
            <p className="text-sm font-semibold italic text-foreground">&ldquo;{d.camp.quote}&rdquo;</p>
          </CardContent>
        </Card>
      </div>

      {/* Week calendar */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">This week</div>
          <div className="grid grid-cols-5 gap-2">
            {d.week.map((w) => (
              <div key={w.day} className="rounded-lg border border-border p-2 text-center">
                <div className="mb-1 text-[10px] font-bold text-muted-foreground">{w.day}</div>
                <div className="text-xs font-semibold text-foreground">{w.label}</div>
                <Badge variant={w.done ? "default" : "outline"} className="mt-1 text-[10px]">
                  {w.done ? "✓" : "—"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Flame className="size-3.5 text-primary" />
        {d.streakDays} jours de streak · {d.sessionsTotal} sessions au total
      </div>
    </div>
  );
}
