import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/user-menu";
import { MobileNav, SidebarNav } from "@/components/app-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-6 md:flex">
        <Link href="/dashboard" className="mb-8 px-2 text-base font-semibold tracking-tight text-sidebar-foreground">
          MMA Mastery
        </Link>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 md:justify-end">
          <Link href="/dashboard" className="font-semibold tracking-tight md:hidden">
            MMA Mastery
          </Link>
          <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
            <UserMenu />
          </Suspense>
        </header>

        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 md:pb-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl animate-in fade-in duration-300">{children}</div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}
