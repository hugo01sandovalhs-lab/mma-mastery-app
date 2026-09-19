import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { hasClubRoleAtLeast, type ClubRole } from "@/lib/domain/club";
import { getClubAnnouncement } from "@/lib/usecases/club-announcement-actions";
import { AnnouncementForm } from "@/components/club/announcement-form";
import { T } from "@/components/i18n-provider";
import { getServerLocale } from "@/lib/i18n-server";
import { type Locale } from "@/lib/i18n";

const INTL_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ru: "ru-RU", ja: "ja-JP" };

export default async function ClubAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string; announcementId: string }>;
}) {
  const { id, announcementId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) notFound();

  const [announcement, locale] = await Promise.all([getClubAnnouncement(announcementId), getServerLocale()]);
  if (!announcement || announcement.club_id !== id) notFound();
  const intlLocale = INTL_LOCALE[locale];

  const canManage = hasClubRoleAtLeast(membership.role as ClubRole, "COACH");
  const { data: groups } = canManage
    ? await supabase.from("groups").select("id, name").eq("club_id", id)
    : { data: [] };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link
          href={`/club/${id}/announcements`}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> <T k="club.announcements" fallback="Annonces" />
        </Link>

        <Card>
          <CardContent className="flex flex-col gap-3 py-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-xl font-semibold tracking-tight">{announcement.title}</h1>
              <Badge variant="outline">{announcement.group_name ?? <T k="club.wholeClub" fallback="Tout le club" />}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                {new Date(announcement.created_at).toLocaleString(intlLocale, { dateStyle: "medium", timeStyle: "short" })}
              </span>
              {announcement.author_name ? <span>{announcement.author_name}</span> : null}
            </div>
            <p className="whitespace-pre-wrap text-sm">{announcement.content}</p>
          </CardContent>
        </Card>

        {canManage ? (
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-semibold tracking-tight"><T k="action.edit" fallback="Modifier" /></h2>
            <AnnouncementForm
              clubId={id}
              groups={(groups ?? []) as { id: string; name: string }[]}
              announcement={{
                id: announcement.id,
                title: announcement.title,
                content: announcement.content,
                group_id: announcement.group_id,
              }}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
