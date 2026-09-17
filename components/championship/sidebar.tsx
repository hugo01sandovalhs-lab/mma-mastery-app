"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { useI18n } from "@/components/i18n-provider";
import { BookOpen, CalendarDays, Dumbbell, Flag, LayoutDashboard, Search, Sparkles, Target, Trophy, User, Users, type LucideIcon } from "lucide-react";

export interface ChampionshipNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  imageSrc?: string;
  imagePosition?: string;
}

const APP_NAV_ITEMS: ChampionshipNavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/training", label: "Entraînement", icon: Dumbbell },
  { href: "/skills", label: "Compétences", icon: Target },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/study", label: "Étude", icon: BookOpen },
  { href: "/goals", label: "Objectifs", icon: Flag },
  { href: "/competition", label: "Compétition", icon: Trophy },
  { href: "/club", label: "Club", icon: Users },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
];

export function ChampionshipAppSidebar() {
  const { t } = useI18n();
  return <ChampionshipSidebar items={APP_NAV_ITEMS.map((item) => ({ ...item, label: t(`nav.${item.href.slice(1)}`, item.label) }))} wordmark="MMA MASTERY" />;
}

export function ChampionshipSidebar({
  items,
  activeHref,
  wordmark,
}: {
  items: ChampionshipNavItem[];
  activeHref?: string;
  wordmark: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex w-40 shrink-0 flex-col gap-5 border-r border-border/50 bg-background pr-3">
      <div className="flex items-center gap-2 px-1 pt-1">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
          M
        </span>
        <span className="text-xs font-extrabold leading-tight tracking-tight text-foreground">{wordmark}</span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = activeHref ? item.href === activeHref : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative isolate flex items-center gap-2.5 overflow-hidden rounded-xl px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-200",
                item.imageSrc && "championship-nav-photo",
                active && !item.imageSrc
                  ? "bg-primary text-primary-foreground"
                  : !item.imageSrc && "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {item.imageSrc ? (
                <Image src={item.imageSrc} alt="" aria-hidden="true" fill sizes="176px" style={{ objectPosition: item.imagePosition }} />
              ) : null}
              <Icon className="relative z-10 size-4 shrink-0" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
