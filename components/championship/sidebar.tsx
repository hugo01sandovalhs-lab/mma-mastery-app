import Link from "next/link";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

export interface ChampionshipNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function ChampionshipSidebar({
  items,
  activeHref,
  wordmark,
}: {
  items: ChampionshipNavItem[];
  activeHref: string;
  wordmark: string;
}) {
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
          const active = item.href === activeHref;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-200",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
