import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getCheckinSessionInfo } from "@/lib/usecases/class-actions";
import { CheckinForm } from "@/components/club/checkin-form";

export default async function CheckinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const info = await getCheckinSessionInfo(code);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex max-w-sm flex-col justify-center py-16">
      <Card>
        <CardHeader>
          <CardTitle>Présence</CardTitle>
          {info ? (
            <CardDescription>
              {info.className} — {info.clubName}
            </CardDescription>
          ) : (
            <CardDescription>Ce code de présence est invalide ou expiré.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {!info ? null : !user ? (
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour confirmer votre présence.{" "}
              <Link href="/login" className="text-foreground underline">
                Se connecter
              </Link>
            </p>
          ) : (
            <CheckinForm code={code} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
