"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkIn, type CheckinState } from "@/lib/usecases/class-actions";
import { useI18n } from "@/components/i18n-provider";

export function CheckinForm({ code }: { code: string }) {
  const { t } = useI18n();
  const initialState: CheckinState = { status: "idle", message: null };
  const [state, formAction, isPending] = useActionState(checkIn, initialState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-2 text-center text-sm text-green-600 dark:text-green-500">
        <CheckCircle2 className="size-8" />
        {t("club.attendanceRecorded", "Présence enregistrée.")}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-center gap-3">
      <input type="hidden" name="code" value={code} />
      {state.status === "error" ? <p className="text-destructive text-sm">{state.message}</p> : null}
      <Button type="submit" disabled={isPending}>
        {t("club.confirmAttendance", "Confirmer ma présence")}
      </Button>
    </form>
  );
}
