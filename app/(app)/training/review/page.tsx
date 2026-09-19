import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Flame,
  HelpCircle,
  MessageCircleQuestion,
  Sprout,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { T } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { REVIEW_ITEM_TYPE_LABELS, type ReviewItem, type ReviewItemType } from "@/lib/domain/review";
import { getReviewQueue } from "@/lib/usecases/review-actions";

const TYPE_ICONS: Record<ReviewItemType, typeof HelpCircle> = {
  question: HelpCircle,
  difficulty: Flame,
  stale: Sprout,
  developing: BookOpen,
  never_applied: Zap,
};

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const items = await getReviewQueue();
  const groups: { type: ReviewItemType; items: ReviewItem[] }[] = (
    ["question", "difficulty", "never_applied", "stale", "developing"] as const
  )
    .map((type) => ({ type, items: items.filter((i) => i.type === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link
          href="/training"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> <T k="nav.training" fallback="Entraînement" />
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="size-5 text-primary" />
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              <T k="review.queueTitle" fallback="À revoir" />
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            <T k="review.queueIntro" fallback="Questions non résolues, difficultés récentes et compétences en attente de pratique." />
          </p>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-2 py-8">
              <BookOpen className="size-6 text-muted-foreground" />
              <p className="font-medium"><T k="review.queueEmpty" fallback="Rien à revoir pour l'instant" /></p>
              <p className="max-w-md text-sm text-muted-foreground">
                <T
                  k="review.queueEmptyHint"
                  fallback="Dès qu'une séance signale une question, une difficulté, ou qu'une compétence reste sans pratique trop longtemps, elle apparaîtra ici."
                />
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <section key={g.type} className="flex flex-col gap-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {REVIEW_ITEM_TYPE_LABELS[g.type]}
                </h2>
                <div className="flex flex-col gap-2">
                  {g.items.map((item, i) => (
                    <ReviewRow key={`${item.skillId}-${i}`} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ReviewRow({ item }: { item: ReviewItem }) {
  const Icon = TYPE_ICONS[item.type];
  return (
    <Link href={`/skills/${item.skillId}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-start gap-3">
          <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.skillName}</span>
              <Badge variant="outline">{REVIEW_ITEM_TYPE_LABELS[item.type]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{item.detail}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
