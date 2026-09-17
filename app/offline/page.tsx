import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#090a08] px-6 text-[#f2efe7]">
      <div className="max-w-md text-center">
        <p className="mb-3 text-sm font-semibold text-[#d7bd80]">Hors connexion</p>
        <h1 className="text-4xl font-extrabold tracking-[-0.05em]">Le round reprendra avec le réseau.</h1>
        <p className="mt-4 text-[#d8d0c0]">Les éléments déjà chargés restent disponibles. Reconnectez-vous pour synchroniser vos séances.</p>
        <Button className="mt-7" render={<Link href="/dashboard" />}>Réessayer</Button>
      </div>
    </main>
  );
}
