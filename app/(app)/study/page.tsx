import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkIcon, ListChecksIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { ChampionshipPhotoMosaic, ChampionshipSectionPhoto } from "@/components/championship/section-photo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { STUDY_STATUSES, STUDY_STATUS_LABEL_KEYS } from "@/lib/domain/knowledge";
import { getSkills } from "@/lib/usecases/skill-actions";
import {
  getBookmarkedSkills,
  getResources,
  getStudyQueue,
} from "@/lib/usecases/knowledge-actions";
import { StudyQueueItemRow } from "@/components/study/study-queue-item-row";
import { ResourceForm } from "@/components/study/resource-form";
import { ResourceRow } from "@/components/study/resource-row";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";

export default async function StudyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const [queue, bookmarks, resources, skills] = await Promise.all([
    getStudyQueue(),
    getBookmarkedSkills(),
    getResources(),
    getSkills(),
  ]);

  return (
    <AppShell>
      <div className="editorial-page editorial-study">
        <PageHeader page="study" title={dict["page.study.title"]} description={dict["page.study.description"]} />

        <ChampionshipPhotoMosaic page="study" />

        <div className="editorial-study-columns">
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ListChecksIcon className="size-4 text-primary" />
            <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["study.queueHeading"]}</h2>
          </div>
          {queue.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                {dict["study.emptyQueue"]}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-6">
              {STUDY_STATUSES.map((status) => {
                const items = queue.filter((i) => i.status === status);
                if (items.length === 0) return null;
                return (
                  <div key={status} className="flex flex-col gap-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase">
                      {dict[STUDY_STATUS_LABEL_KEYS[status]]} ({items.length})
                    </h3>
                    <div className="flex flex-col gap-2">
                      {items.map((item) => (
                        <StudyQueueItemRow key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="size-4 text-primary" />
            <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["study.favoritesHeading"]}</h2>
          </div>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict["study.noFavorites"]}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bookmarks.map((s) => (
                <Link key={s.id} href={`/skills/${s.id}`}>
                  <Badge variant="secondary">{s.name}</Badge>
                </Link>
              ))}
            </div>
          )}
        </section>

        <ChampionshipSectionPhoto
          src="/mma-mastery-photos/anastase-maragos-Lmy0bxMVnBg-unsplash.jpg"
          alt="Athlète en pause de réflexion contre le sac"
          label="Prendre le temps de comprendre"
          labelKey="photoLabel.takeTimeUnderstand"
          icon={<BookmarkIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />}
          objectPosition="45% 38%"
          size="large"
        />

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">{dict["study.resourcesHeading"]}</h2>
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dict["study.noResources"]}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {resources.map((r) => (
                <ResourceRow key={r.id} resource={r} />
              ))}
            </div>
          )}
          <ResourceForm skills={skills} />
        </section>
        </div>
      </div>
    </AppShell>
  );
}
