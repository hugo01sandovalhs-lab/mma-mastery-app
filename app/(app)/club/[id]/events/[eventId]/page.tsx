import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { EVENT_TYPE_LABEL_KEYS } from "@/lib/domain/club-event";
import { getClubEventDetail } from "@/lib/usecases/club-event-actions";
import { EventRegistrationButton } from "@/components/club/event-registration-button";
import { T } from "@/components/i18n-provider";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";

const INTL_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ru: "ru-RU", ja: "ja-JP" };

export default async function ClubEventDetailPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { id, eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [event, locale] = await Promise.all([getClubEventDetail(eventId), getServerLocale()]);
  if (!event) notFound();
  const dict = DICTIONARIES[locale];
  const intlLocale = INTL_LOCALE[locale];

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link href={`/club/${id}/events`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {event.club_name}
        </Link>

        <div className="flex flex-col gap-3 border-b border-border pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{event.name}</h1>
            <Badge variant="outline">{dict[EVENT_TYPE_LABEL_KEYS[event.event_type]]}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{new Date(event.starts_at).toLocaleString(intlLocale, { dateStyle: "full", timeStyle: "short" })}</span>
            {event.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {event.location}
              </span>
            ) : null}
          </div>
          {event.notes ? <p className="text-sm">{event.notes}</p> : null}
          <div>
            <EventRegistrationButton eventId={event.id} clubId={id} isRegistered={event.myStatus === "registered"} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
            <Users className="size-4 text-primary" /> {formatT(dict["club.participantsCount"], { count: event.participants.length })}
          </h2>
          {event.participants.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground"><T k="club.noRegistrations" fallback="Aucun inscrit pour l'instant." /></CardContent>
            </Card>
          ) : (
            <div className="flex flex-wrap gap-2">
              {event.participants.map((p) => (
                <Badge key={p.user_id} variant="outline">
                  {p.display_name ?? dict["clubRole.MEMBER"]}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
