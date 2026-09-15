import "./championship.css";
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
  {
    href: "/dashboard",
    label: "Accueil",
    icon: LayoutDashboard,
    imageSrc: "/mma-mastery-photos/5zYAn7DilpRIqo18MtLZWFcxEEyGNSEMLHz4MzZaAPn-aWfEkVGojp3N-cJHB9-DBQspwrFJnVjOPeoVAqkzZboTryqAzsJWkgJb-_veSUnmX7NiZLkSJ_RRFgnpw0FtwaRMzun_uEendlymBwuuL8TNDc8KF3auwIwQLBIkyYAqOV4VfND_QpXjzItHjsnd.jpg",
  },
  {
    href: "/training",
    label: "Entraînement",
    icon: Dumbbell,
    imageSrc: "/mma-mastery-photos/NEwKf51qFMcLOle04d4EBZC0QdCs7WcIrR8u8jyqXGchH71hsBRIdsQEuhXqU8ljkJP5s3sLbk5IUIkBmj8vyLQYBl53RWDDpX_EAQjirXvzLNZh98OVYnHswIUWi2X0AC8_Rv-Z1R-iCpwlnXFICtiGI1HCq_tZCl9TNOqvO9vGiBIFXYZgksSqD282_h-P.jpg",
  },
  {
    href: "/skills",
    label: "Compétences",
    icon: Target,
    imageSrc: "/mma-mastery-photos/WeoAGuytjpldcsH9ZheaQ0FVFkYcK3DEIfN3OjYq-QrxbYYPw7AgU47L_Kb2H8yFK-I-ozU73wVIuWaTLGwPzm4vlBplJFZYISkczYD4ufAUram7ECjqClRhzTSAU0qlOkNUf5b_Yj-iD5KJKAD3B5dnSShB6pcqD4vocmx5WJyC6LaNyZ-LTUmsDd8itTBK.jpg",
  },
  {
    href: "/coach",
    label: "Coach",
    icon: Sparkles,
    imageSrc: "/mma-mastery-photos/pexels-cottonbro-4761782.jpg",
  },
  { href: "/study", label: "Étude", icon: BookOpen },
  { href: "/goals", label: "Objectifs", icon: Flag },
  {
    href: "/competition",
    label: "Compétition",
    icon: Trophy,
    imageSrc: "/mma-mastery-photos/pexels-mariano-di-luch-679379189-38571271.jpg",
  },
  { href: "/club", label: "Club", icon: Users },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/profile", label: "Profil", icon: User },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-fight-theme="championship" className="championship-app min-h-screen bg-background text-foreground">
      <style dangerouslySetInnerHTML={{ __html: generateThemeCss() }} />
      <div className="championship-frame">
        <div className="championship-nav">
          <ChampionshipSidebar items={NAV_ITEMS} activeHref="/dashboard" wordmark="MMA MASTERY" />
        </div>

        <div className="championship-main">
          <header className="championship-account">
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
