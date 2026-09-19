import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getCheckinSessionInfo } from "@/lib/usecases/class-actions";
import { CheckinForm } from "@/components/club/checkin-form";
import { DICTIONARIES } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function CheckinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const info = await getCheckinSessionInfo(code);
  const dict = DICTIONARIES[await getServerLocale()];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex max-w-sm flex-col justify-center py-16">
      <Card>
        <CardHeader>
          <CardTitle>{dict["checkin.title"]}</CardTitle>
          {info ? (
            <CardDescription>
              {info.className} — {info.clubName}
            </CardDescription>
          ) : (
            <CardDescription>{dict["checkin.invalidCode"]}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {!info ? null : !user ? (
            <p className="text-sm text-muted-foreground">
              {dict["checkin.loginPrompt"]}{" "}
              <Link href="/login" className="text-foreground underline">
                {dict["auth.login.submit"]}
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
