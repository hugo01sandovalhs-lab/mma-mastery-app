import "./championship.css";
import "./editorial.css";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/user-menu";
import { MobileNav, MobileSectionNav } from "@/components/app-nav";
import { ChampionshipAppSidebar } from "@/components/championship/sidebar";
import { ShellRoot } from "@/components/championship/shell-root";
import { LanguageSwitcher } from "@/components/language-switcher";
import { QuickActionsBar } from "@/components/quick-actions-bar";
import { QuickLogButton } from "@/components/quick-log/quick-log-button";
import { CommandPalette } from "@/components/search/command-palette";
import { getDisciplines } from "@/lib/usecases/training-actions";
import { getSkills } from "@/lib/usecases/skill-actions";

/**
 * Disciplines/skills power the global Quick Log dialog — both are
 * already `unstable_cache`-backed catalog reads (see training-actions.ts /
 * skill-actions.ts), so fetching them once per shell render is cheap.
 * Unauthenticated visitors get an empty catalog (RLS blocks the read) and
 * the button simply doesn't render — no crash, no auth check duplicated here.
 */
async function QuickLog() {
  const [disciplines, skills] = await Promise.all([
    getDisciplines().catch(() => []),
    getSkills().catch(() => []),
  ]);
  return <QuickLogButton disciplines={disciplines} skills={skills} />;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <ShellRoot>
      <div className="championship-frame">
        <div className="championship-nav">
          <ChampionshipAppSidebar />
        </div>

        <div className="championship-main">
          <header className="championship-account">
            <MobileSectionNav />
            <Link href="/dashboard" className="font-extrabold tracking-tight md:hidden">
              MMA MASTERY
            </Link>
            <div className="flex items-center gap-2">
              <CommandPalette />
              <LanguageSwitcher />
              <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
                <UserMenu />
              </Suspense>
            </div>
          </header>

          {children}
        </div>
      </div>

      <MobileNav />
      <QuickActionsBar />
      <Suspense fallback={null}>
        <QuickLog />
      </Suspense>
    </ShellRoot>
  );
}
