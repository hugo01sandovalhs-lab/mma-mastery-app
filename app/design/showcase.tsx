import { Award, Flame, TrendingUp, Users, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BARS = [62, 80, 45, 90, 70, 55, 85];

export function Showcase() {
  return (
    <div
      className="transition-colors"
      style={{ transitionDuration: "var(--lab-transition)" }}
    >
      {/* Nav */}
      <nav
        className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
        style={{ marginBottom: "var(--lab-gap)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flame className="size-4" />
          </div>
          <span
            className="text-foreground"
            style={{
              fontWeight: "var(--lab-heading-weight)" as never,
              letterSpacing: "var(--lab-heading-tracking)",
            }}
          >
            MMA Mastery
          </span>
        </div>
        <div className="hidden gap-4 text-sm text-muted-foreground sm:flex">
          <span>Dashboard</span>
          <span>Training</span>
          <span>Skills</span>
          <span>Club</span>
        </div>
        <Badge variant="secondary">Coach</Badge>
      </nav>

      {/* Hero metrics */}
      <div
        className="grid grid-cols-2 md:grid-cols-4"
        style={{ gap: "var(--lab-gap)", marginBottom: "var(--lab-gap)" }}
      >
        {[
          { label: "Training streak", value: "12j", icon: Flame },
          { label: "Sessions", value: "48", icon: Calendar },
          { label: "Mastery avg", value: "63%", icon: TrendingUp },
          { label: "Goals actifs", value: "3", icon: Target },
        ].map(({ label, value, icon: Icon }) => (
          <Card
            key={label}
            className="border-border bg-card transition-transform hover:[transform:scale(var(--lab-hover-scale))]"
            style={{ transitionDuration: "var(--lab-transition)" }}
          >
            <CardContent style={{ padding: "var(--lab-card-padding)" }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon className="size-4 text-primary" />
              </div>
              <div
                className="text-2xl text-foreground"
                style={{ fontWeight: "var(--lab-heading-weight)" as never }}
              >
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "var(--lab-gap)" }}>
        {/* Data viz card */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader style={{ padding: "var(--lab-card-padding)" }}>
            <CardTitle
              className="text-foreground"
              style={{
                fontWeight: "var(--lab-heading-weight)" as never,
                letterSpacing: "var(--lab-heading-tracking)",
              }}
            >
              Charge d&apos;entraînement — 7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent
            className="flex items-end gap-2"
            style={{ padding: "var(--lab-card-padding)", height: "140px" }}
          >
            {BARS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-primary/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </CardContent>
        </Card>

        {/* Badges / status */}
        <Card className="border-border bg-card">
          <CardHeader style={{ padding: "var(--lab-card-padding)" }}>
            <CardTitle
              className="text-foreground"
              style={{ fontWeight: "var(--lab-heading-weight)" as never }}
            >
              Progression
            </CardTitle>
          </CardHeader>
          <CardContent
            className="flex flex-col"
            style={{ padding: "var(--lab-card-padding)", gap: "var(--lab-gap)" }}
          >
            <div className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              <span className="text-sm text-foreground">Ceinture bleue</span>
              <Badge className="ml-auto">Actif</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-accent" />
              <span className="text-sm text-foreground">Groupe compétition</span>
              <Badge variant="outline" className="ml-auto">
                8 membres
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buttons row */}
      <div
        className="flex flex-wrap items-center rounded-xl border border-border bg-card"
        style={{ padding: "var(--lab-card-padding)", gap: "0.5rem", marginTop: "var(--lab-gap)" }}
      >
        <Button variant="default">Log training</Button>
        <Button variant="secondary">View skills</Button>
        <Button variant="outline">Study queue</Button>
        <Button variant="ghost">Cancel</Button>
        <Badge>New</Badge>
        <Badge variant="secondary">Beta</Badge>
        <Badge variant="outline">Draft</Badge>
      </div>
    </div>
  );
}
