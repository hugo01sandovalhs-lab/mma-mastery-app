import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <main className="editorial-content" aria-label="Chargement de la page">
      <div className="editorial-page">
        <Skeleton className="h-56 w-full rounded-md" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
