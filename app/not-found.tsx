import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Page introuvable</h1>
      <Button render={<Link href="/" />}>Retour à l&apos;accueil</Button>
    </div>
  );
}
