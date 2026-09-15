import { Home, Activity, ListChecks, LineChart, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LAB_DATA } from "@/lib/design/lab-data";

const NAV = [
  { label: "Overview", icon: Home, active: true },
  { label: "Training", icon: Activity },
  { label: "Skills", icon: ListChecks },
  { label: "Analytics", icon: LineChart },
  { label: "Coach", icon: Bot },
];

export function FightScience() {
  const d = LAB_DATA;
  return (
    <div className="grid grid-cols-[auto,1fr] gap-4">
      <aside className="hidden w-32 flex-col gap-1 sm:flex">
        {NAV.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${active ? "bg-card font-semibold text-foreground" : "text-muted-foreground"}`}
          >
            <Icon className="size-3.5" />
            {label}
          </div>
        ))}
      </aside>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card className="border-border bg-card lg:col-span-2">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performance</span>
                <span className="text-[10px] text-primary">+6% vs last week</span>
              </div>
              <div className="flex items-end gap-4">
                <div
                  className="flex size-20 items-center justify-center rounded-full text-lg font-bold text-foreground"
                  style={{ background: `conic-gradient(var(--primary) ${d.readiness * 3.6}deg, var(--muted) 0deg)` }}
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-card">{d.readiness}</span>
                </div>
                <div className="flex h-16 flex-1 items-end gap-1">
                  {d.weekBars.map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-accent" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</div>
              <div className="space-y-2">
                {d.skills.map((s) => (
                  <div key={s.name}>
                    <div className="mb-0.5 flex justify-between text-[11px] text-foreground">
                      <span>{s.name}</span>
                      <span>{s.value}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Training load</div>
              <div className="flex h-16 items-end gap-1">
                {d.trainingLoad.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-primary" style={{ height: `${h}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skill progression</div>
              <div className="flex h-16 items-end gap-1">
                {d.weekBars.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-accent/70" style={{ height: `${h}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
