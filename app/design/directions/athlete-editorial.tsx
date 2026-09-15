import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LAB_DATA } from "@/lib/design/lab-data";

export function AthleteEditorial() {
  const d = LAB_DATA;
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">MMA Mastery</span>
        <div className="hidden gap-6 sm:flex">
          <span className="text-foreground">Today</span>
          <span>Train</span>
          <span>Learn</span>
          <span>Progress</span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-sm text-muted-foreground">Your next session</div>
          <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {d.todaySession.skill}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">{d.todaySession.minutes} min · focus block</p>
          <Button size="lg" className="rounded-full px-8">Start session</Button>
        </div>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <div className="text-5xl font-semibold text-foreground">{d.masteryAvg}%</div>
            <div className="text-sm text-muted-foreground">Consistency</div>
            <div className="text-xs text-primary">↑ 12% this month</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-secondary">
        <CardContent className="p-8">
          <p className="mb-4 text-lg font-medium leading-relaxed text-foreground">
            You&apos;ve been struggling with {d.strugglingWith.skill.toLowerCase()}.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span>{d.strugglingWith.sessions} sessions</span>
            <span>{d.strugglingWith.observations} observations</span>
            <span>{d.strugglingWith.failedAttempts} failed live attempts</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {d.skills.map((s) => (
          <div key={s.name} className="text-center">
            <div className="text-3xl font-semibold text-foreground">{s.value}%</div>
            <div className="text-xs text-muted-foreground">{s.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
