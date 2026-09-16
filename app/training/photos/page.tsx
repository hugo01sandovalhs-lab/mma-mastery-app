import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { PhotoGallery } from "@/components/training/photo-gallery";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getTrainingPhotos } from "@/lib/usecases/training-photo-actions";
import { getTrainingSessions } from "@/lib/usecases/training-actions";

export default async function TrainingPhotosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [photos, sessions] = await Promise.all([getTrainingPhotos(), getTrainingSessions()]);
  return <AppShell><div className="editorial-page editorial-training">
    <PageHeader page="training" title="Galerie d’entraînement" description="Conservez les images qui racontent votre progression." actions={<Button variant="outline" render={<Link href="/training" />}><ArrowLeft />Entraînement</Button>} />
    <PhotoGallery photos={photos} sessions={sessions.map(({ id, date, title }) => ({ id, date, title }))} />
  </div></AppShell>;
}
