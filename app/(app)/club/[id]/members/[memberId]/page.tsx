import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { CLUB_ROLE_LABELS } from "@/lib/domain/club";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/domain/class";
import { getMemberDetail } from "@/lib/usecases/club-admin-actions";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const { id, memberId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await getMemberDetail(id, memberId);
  if (!member) notFound();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <Link href={`/club/${id}/admin`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Administration
        </Link>

        <div className="flex flex-col gap-1.5 border-b border-border pb-6">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {member.displayName ?? "Membre"}
            </h1>
            <Badge variant="outline">{CLUB_ROLE_LABELS[member.role]}</Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            Membre depuis {new Date(member.memberSince).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Groupes</h2>
          <div className="flex flex-wrap gap-2">
            {member.groups.length === 0 ? (
              <span className="text-sm text-muted-foreground">Aucun groupe.</span>
            ) : (
              member.groups.map((g) => (
                <Badge key={g.id} variant="outline">
                  {g.name}
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Présence</h2>
            <Badge variant="outline">{member.attendanceRate}% de présence</Badge>
          </div>
          {member.attendance.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">Aucune présence enregistrée.</CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {member.attendance.map((a) => (
                <Card key={a.session_id}>
                  <CardContent className="flex items-center justify-between gap-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{a.class_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.starts_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <Badge variant={a.status === "present" ? "default" : "outline"}>
                      {ATTENDANCE_STATUS_LABELS[a.status]}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
