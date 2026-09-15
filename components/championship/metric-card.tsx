import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "./progress-ring";

type ChampionshipMetricCardProps = {
  eyebrow: string;
  icon?: LucideIcon;
  subtitle?: React.ReactNode;
} & (
  | { value: React.ReactNode; ring?: undefined; insufficientData?: undefined }
  | { value?: undefined; ring: number; insufficientData?: boolean }
);

export function ChampionshipMetricCard({
  eyebrow,
  value,
  ring,
  insufficientData,
  icon: Icon,
  subtitle,
}: ChampionshipMetricCardProps) {
  return (
    <Card className="rounded-2xl border-border bg-card transition-shadow duration-200 hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {Icon ? <Icon className="size-3.5 text-primary" /> : null}
            {eyebrow}
          </span>
          {ring === undefined ? (
            <span className="truncate text-lg font-bold text-foreground">{value}</span>
          ) : null}
          {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
        </div>
        {ring !== undefined ? (
          <ProgressRing value={ring} size={64} strokeWidth={6} insufficientData={insufficientData} />
        ) : null}
      </CardContent>
    </Card>
  );
}
