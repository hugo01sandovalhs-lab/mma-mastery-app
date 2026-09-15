import Link from "next/link";
import { Suspense } from "react";
import {
  BookOpen,
  Dumbbell,
  Flag,
  LayoutDashboard,
  Search,
  Sparkles,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/user-menu";
import { MobileNav } from "@/components/app-nav";
import { ChampionshipSidebar, type ChampionshipNavItem } from "@/components/championship/sidebar";
import { generateThemeCss } from "@/lib/design/themes";

const NAV_ITEMS: ChampionshipNavItem[] = [
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
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-fight-theme="championship" className="min-h-screen bg-background text-foreground">
      <style dangerouslySetInnerHTML={{ __html: generateThemeCss() }} />
      <div className="mx-auto flex w-full max-w-7xl gap-4 p-4 pb-24 sm:p-6 md:pb-6 lg:gap-6 lg:p-8">
        <div className="hidden shrink-0 md:block">
          <ChampionshipSidebar items={NAV_ITEMS} activeHref="/dashboard" wordmark="MMA MASTERY" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex items-center justify-between md:justify-end">
            <Link href="/dashboard" className="font-extrabold tracking-tight md:hidden">
              MMA MASTERY
            </Link>
            <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
              <UserMenu />
            </Suspense>
          </header>

          {children}
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
