"use client";

import { useEffect } from "react";
import { markAnnouncementsRead } from "@/lib/usecases/club-announcement-actions";

export function MarkAnnouncementsRead({ clubId }: { clubId: string }) {
  useEffect(() => {
    markAnnouncementsRead(clubId).catch(() => {});
  }, [clubId]);
  return null;
}
