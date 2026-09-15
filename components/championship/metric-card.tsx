import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "./progress-ring";

type ChampionshipMetricCardProps =
  | { eyebrow: string; value: React.ReactNode; ring?: undefined }
  | { eyebrow: string; value?: undefined; ring: number };

export function ChampionshipMetricCard({ eyebrow, value, ring }: ChampionshipMetricCardProps) {
  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </span>
          {ring === undefined ? (
            <span className="text-lg font-bold text-foreground">{value}</span>
          ) : null}
        </div>
        {ring !== undefined ? <ProgressRing value={ring} size={64} strokeWidth={6} /> : null}
      </CardContent>
    </Card>
  );
}
