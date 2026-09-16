import "./championship.css";
import "./editorial.css";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/user-menu";
import { MobileNav, MobileSectionNav } from "@/components/app-nav";
import { ChampionshipAppSidebar } from "@/components/championship/sidebar";

export function DashboardShell({ children, interior = false }: { children: React.ReactNode; interior?: boolean }) {
  return (
    <div data-fight-theme="championship" className={`championship-app min-h-screen bg-background text-foreground${interior ? " championship-interior" : ""}`}>
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
