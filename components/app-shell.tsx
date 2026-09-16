import { DashboardShell } from "@/app/dashboard/dashboard-shell";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell interior>
      <main className="editorial-content">{children}</main>
    </DashboardShell>
  );
}
