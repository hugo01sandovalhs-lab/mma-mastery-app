import { BookOpen, Dumbbell, ListChecks, GraduationCap, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LAB_DATA } from "@/lib/design/lab-data";

const NAV = [
  { label: "Journal", icon: BookOpen, active: true },
  { label: "Training", icon: Dumbbell },
  { label: "Skills", icon: ListChecks },
  { label: "Learn", icon: GraduationCap },
  { label: "Coach", icon: Bot },
];

export function FightJournal() {
  const d = LAB_DATA;
  return (
    <div className="grid grid-cols-[auto,1fr] gap-4 font-serif">
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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr,1fr]">
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <div className="mb-3 text-xs text-muted-foreground">{d.journal.date}</div>
              <h2 className="mb-3 text-xl font-semibold text-foreground">Good session today.</h2>
              <p className="mb-4 text-sm leading-relaxed text-foreground/90">{d.journal.text}</p>
              <div className="flex flex-wrap gap-1.5">
                {d.journal.tags.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Today&apos;s training</div>
                <div className="text-base font-semibold text-foreground">
                  {d.todaySession.skill} · {d.todaySession.minutes} min
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-secondary">
              <CardContent className="p-4">
                <p className="text-sm italic text-foreground">&ldquo;{d.journal.quote}&rdquo;</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Recent entries</div>
            <div className="divide-y divide-border">
              {d.recentEntries.map((e) => (
                <div key={e.label} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{e.date}</span>
                  <span className="text-foreground">{e.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
