import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkIcon, LibraryIcon, ListChecksIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { STUDY_STATUSES, STUDY_STATUS_LABELS } from "@/lib/domain/knowledge";
import { getSkills } from "@/lib/usecases/skill-actions";
import {
  getBookmarkedSkills,
  getResources,
  getStudyQueue,
} from "@/lib/usecases/knowledge-actions";
import { StudyQueueItemRow } from "@/components/study/study-queue-item-row";
import { ResourceForm } from "@/components/study/resource-form";
import { ResourceRow } from "@/components/study/resource-row";

export default async function StudyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [queue, bookmarks, resources, skills] = await Promise.all([
    getStudyQueue(),
    getBookmarkedSkills(),
    getResources(),
    getSkills(),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <LibraryIcon className="size-5 text-primary" />
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Étude</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            File d&apos;étude, favoris et ressources externes.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ListChecksIcon className="size-4 text-primary" />
            <h2 className="font-heading text-lg font-semibold tracking-tight">File d&apos;étude</h2>
          </div>
          {queue.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Aucune compétence en file d&apos;étude. Ajoutez-en depuis une page compétence.
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
                      {STUDY_STATUS_LABELS[status]} ({items.length})
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
            <h2 className="font-heading text-lg font-semibold tracking-tight">Favoris</h2>
          </div>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune compétence en favori.</p>
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

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Mes ressources</h2>
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune ressource enregistrée.</p>
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
    </AppShell>
  );
}
