"use client";

import { useTransition } from "react";
import { QrCode, TrashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ATTENDANCE_STATUS_LABELS,
  checkinCodeIsValid,
  type AttendanceStatus,
} from "@/lib/domain/class";
import {
  deleteClassSession,
  markAttendance,
  rotateCheckinCode,
  type ClassSessionItem,
} from "@/lib/usecases/class-actions";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function SessionCard({
  session,
  clubId,
  classId,
  roster,
  viewerUserId,
  canManage,
  qrSvg,
}: {
  session: ClassSessionItem;
  clubId: string;
  classId: string;
  roster: { user_id: string; display_name: string | null }[];
  viewerUserId: string;
  canManage: boolean;
  qrSvg: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const attendanceByUser = new Map(session.attendance.map((a) => [a.user_id, a.status]));
  const codeValid = checkinCodeIsValid(session.checkin_code_expires_at);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{formatDateTime(session.starts_at)}</CardTitle>
        {canManage ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Supprimer la séance"
            disabled={isPending}
            onClick={() => startTransition(() => deleteClassSession(session.id, clubId, classId))}
          >
            <TrashIcon />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canManage ? (
          <div className="flex flex-col items-start gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center">
            {codeValid && qrSvg ? (
              <div
                className="size-[176px] shrink-0 [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="flex size-[176px] shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <QrCode className="size-8" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {codeValid ? (
                <p className="text-sm text-muted-foreground">
                  Code actif jusqu&apos;à {formatDateTime(session.checkin_code_expires_at as string)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun code de présence actif.</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await rotateCheckinCode(session.id, clubId, classId);
                  })
                }
              >
                <QrCode /> {codeValid ? "Régénérer le code" : "Générer un code"}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun membre à présenter.</p>
          ) : canManage ? (
            roster.map((m) => {
              const status = attendanceByUser.get(m.user_id);
              return (
                <div key={m.user_id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <span className="text-sm">{m.display_name ?? "Membre"}</span>
                  <div className="flex items-center gap-1.5">
                    {(["present", "absent"] as AttendanceStatus[]).map((s) => (
                      <Button
                        key={s}
                        type="button"
                        size="sm"
                        variant={status === s ? "default" : "outline"}
                        disabled={isPending}
                        onClick={() => startTransition(() => markAttendance(session.id, m.user_id, s, clubId, classId))}
                      >
                        {ATTENDANCE_STATUS_LABELS[s]}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
              <span className="text-sm">Votre présence</span>
              <Badge variant="outline">
                {attendanceByUser.has(viewerUserId)
                  ? ATTENDANCE_STATUS_LABELS[attendanceByUser.get(viewerUserId) as AttendanceStatus]
                  : "Non renseignée"}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
