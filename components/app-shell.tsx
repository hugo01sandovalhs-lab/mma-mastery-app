import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/user-menu";

const NAV_LINKS = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/training", label: "Entraînement" },
  { href: "/skills", label: "Compétences" },
  { href: "/profile", label: "Profil" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            MMA Mastery
          </Link>
          <nav className="hidden gap-4 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <Suspense fallback={<Skeleton className="h-8 w-8 rounded-full" />}>
          <UserMenu />
        </Suspense>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      <nav className="border-border flex justify-around border-t py-2 sm:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
