"use client";

import Link from "next/link";
import { Dumbbell, PlayCircle, Sparkles, Timer as TimerIcon } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

const ACTIONS = [
  { href: "/training/new", key: "action.newSession", fallback: "Nouvelle séance", icon: Dumbbell },
  { href: "/training#timer", key: "action.timer", fallback: "Timer", icon: TimerIcon },
  { href: "/coach", key: "nav.coach", fallback: "Coach", icon: Sparkles },
  { href: "/youtube", key: "nav.youtube", fallback: "YouTube", icon: PlayCircle },
] as const;

export function QuickActionsBar() {
  const { t } = useI18n();
  return (
    <nav aria-label={t("action.newSession", "Actions rapides")} className="quick-actions-bar">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href} className="quick-actions-bar-item">
            <Icon className="size-4" aria-hidden="true" />
            <span>{t(action.key, action.fallback)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
