"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, LayoutDashboard, Target, User } from "lucide-react";
import { cn } from "cn";

const NAV_LINKS = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/training", label: "Entraînement", icon: Dumbbell },
  { href: "/skills", label: "Compétences", icon: Target },
  { href: "/profile", label: "Profil", icon: User },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-background/95 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-16 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[0.7rem] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
