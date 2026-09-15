import { Home, BookOpen, Layers, Network, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LAB_DATA } from "@/lib/design/lab-data";

const NAV = [
  { label: "Home", icon: Home },
  { label: "Techniques", icon: BookOpen, active: true },
  { label: "Positions", icon: Layers },
  { label: "Concepts", icon: Network },
];

export function FightAcademy() {
  const d = LAB_DATA;
  const t = d.technique;
  return (
    <div className="grid grid-cols-[auto,1fr] gap-4">
      <aside className="hidden w-36 flex-col gap-1 rounded-lg border border-border bg-card p-2 sm:flex">
        <div className="mb-2 flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground">
          <Search className="size-3.5" />
          Search
        </div>
        {NAV.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground"}`}
          >
            <Icon className="size-3.5" />
            {label}
          </div>
        ))}
      </aside>

      <div className="min-w-0 flex-1 space-y-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t.position}</span>
              <span>/</span>
              <span className="text-primary">Technique</span>
            </div>
            <h2 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">{t.name}</h2>
            <div className="flex flex-wrap gap-1.5">
              {t.concepts.map((c) => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Concepts</div>
              <ul className="space-y-1 text-sm text-foreground">
                {t.concepts.map((c) => <li key={c}>· {c}</li>)}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prerequisites</div>
              <ul className="space-y-1 text-sm text-foreground">
                {t.prerequisites.map((c) => <li key={c}>· {c}</li>)}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Follow-ups</div>
              <ul className="space-y-1 text-sm text-foreground">
                {t.followUps.map((c) => <li key={c}>· {c}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related techniques</div>
              <div className="flex flex-col gap-1">
                {t.related.map((r) => (
                  <div key={r} className="rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted">{r}</div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-secondary">
            <CardContent className="p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Study queue · {d.studyQueue.length} techniques
              </div>
              <div className="flex flex-col gap-1">
                {d.studyQueue.map((q) => (
                  <div key={q.name} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm">
                    <span className="text-foreground">{q.name}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{q.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
