import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getDisciplines } from "@/lib/usecases/training-actions";
import { getSkills } from "@/lib/usecases/skill-actions";

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; discipline?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { q, discipline } = await searchParams;
  const [disciplines, skills] = await Promise.all([
    getDisciplines(),
    getSkills({ disciplineId: discipline || undefined, search: q || undefined }),
  ]);

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold">Compétences</h1>

      <form className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px_auto]">
        <Input name="q" placeholder="Rechercher une compétence..." defaultValue={q ?? ""} />
        <Select
          name="discipline"
          defaultValue={discipline ?? ""}
          items={[
            { value: "", label: "Toutes les disciplines" },
            ...disciplines.map((d) => ({ value: d.id, label: d.name })),
          ]}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Discipline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes les disciplines</SelectItem>
            {disciplines.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
      </form>

      {skills.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground text-sm">
            Aucune compétence trouvée.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {skills.map((s) => (
            <Link key={s.id} href={`/skills/${s.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{s.name}</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{s.discipline.name}</Badge>
                    {s.category ? <Badge variant="outline">{s.category}</Badge> : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
