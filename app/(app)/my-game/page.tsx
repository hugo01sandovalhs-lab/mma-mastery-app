import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/championship/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { loadSkillIntelligenceInputs } from "@/lib/usecases/training-intelligence-actions";
import { buildMyGame, type MyGameSection } from "@/lib/domain/my-game";

const SECTIONS: { key: MyGameSection; title: string; description: string }[] = [
  { key: "in_game", title: "Dans mon jeu", description: "Techniques appliquées avec des preuves en situation." },
  { key: "developing", title: "En développement", description: "Compétences pour lesquelles votre pratique produit déjà des preuves." },
  { key: "to_work", title: "À travailler", description: "Techniques étudiées mais peu appliquées, ou devenues anciennes." },
];

export default async function MyGamePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const items = buildMyGame(await loadSkillIntelligenceInputs());

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <PageHeader page="skills" title="My Game" description="Une lecture factuelle de votre jeu, construite uniquement à partir de vos séances, sparrings et preuves." />
        <div className="grid gap-4 lg:grid-cols-3">
          {SECTIONS.map((section) => {
            const sectionItems = items.filter((item) => item.section === section.key);
            return (
              <Card key={section.key}>
                <CardHeader><CardTitle>{section.title}</CardTitle><p className="text-sm text-muted-foreground">{section.description}</p></CardHeader>
                <CardContent>
                  {sectionItems.length === 0 ? <p className="text-sm text-muted-foreground">Données insuffisantes.</p> : (
                    <ul className="space-y-3">{sectionItems.map((item) => (
                      <li key={item.skillId} className="rounded-lg border border-border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{item.skillName}</strong><Badge variant="outline">{item.discipline}</Badge></div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                      </li>
                    ))}</ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
