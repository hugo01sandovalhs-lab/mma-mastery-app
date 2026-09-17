"use client";

import { usePathname } from "next/navigation";
import { cn } from "cn";

export function ShellRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      data-fight-theme="championship"
      className={cn(
        "championship-app min-h-screen bg-background text-foreground",
        pathname !== "/dashboard" && "championship-interior",
      )}
    >
      {children}
    </div>
  );
}
