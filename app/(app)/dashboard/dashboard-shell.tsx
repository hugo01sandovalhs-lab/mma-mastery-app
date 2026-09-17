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
    </ShellRoot>
  );
}
