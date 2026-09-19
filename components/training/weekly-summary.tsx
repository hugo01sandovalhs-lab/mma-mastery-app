import { T } from "@/components/i18n-provider";
import { Card, CardContent } from "@/components/ui/card";
import type { SessionStats } from "@/lib/domain/training";

export function WeeklySummaryCard({ stats }: { stats: SessionStats }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-4">
        <h3 className="text-sm font-semibold">
          <T k="training.weeklySummary" fallback="Résumé de la semaine" />
        </h3>
        {stats.weekCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            <T k="training.weeklyEmpty" fallback="Aucune séance cette semaine." />
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              <T k="training.weekCount" fallback="{count} séances cette semaine" vars={{ count: stats.weekCount }} />
            </span>
            <span>
              <T k="training.weeklyMinutes" fallback="{count} minutes" vars={{ count: stats.weekMinutes }} />
            </span>
            <span>
              <T
                k="training.weeklyTechniques"
                fallback="{count} technique(s) travaillée(s)"
                vars={{ count: stats.weekTechniqueCount }}
              />
            </span>
            {stats.weekDisciplines.length > 0 ? (
              <span>
                <T k="training.weeklyDisciplines" fallback="Disciplines" />: {stats.weekDisciplines.join(", ")}
              </span>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
