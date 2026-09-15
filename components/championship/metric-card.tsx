import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "./progress-ring";

type ChampionshipMetricCardProps = {
  eyebrow: string;
  icon?: LucideIcon;
  subtitle?: React.ReactNode;
  photoSrc?: string;
  photoAlt?: string;
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
  photoSrc,
  photoAlt,
}: ChampionshipMetricCardProps) {
  return (
    <Card className="rounded-2xl border-border bg-card transition-shadow duration-200 hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={photoAlt ?? ""}
              className="size-11 shrink-0 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : null}
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {Icon ? <Icon className="size-3.5 text-primary" /> : null}
              {eyebrow}
            </span>
            {ring === undefined ? (
              <span className="truncate text-sm font-bold text-foreground">{value}</span>
            ) : null}
            {subtitle ? <span className="truncate text-xs text-muted-foreground">{subtitle}</span> : null}
          </div>
        </div>
        {ring !== undefined ? (
          <ProgressRing value={ring} size={56} strokeWidth={5} insufficientData={insufficientData} />
        ) : null}
      </CardContent>
    </Card>
  );
}
