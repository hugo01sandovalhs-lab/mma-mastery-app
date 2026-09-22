import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getResourcesForVideo } from "@/lib/usecases/knowledge-actions";
import { getSkills } from "@/lib/usecases/skill-actions";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";
import { VideoAnalysis } from "@/components/youtube/video-analysis";

export default async function YouTubeWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ title?: string; channel?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { videoId } = await params;
  const { title, channel } = await searchParams;
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const locale = await getServerLocale();
  const dict = DICTIONARIES[locale];

  const [notes, skills] = await Promise.all([
    getResourcesForVideo(url).catch(() => []),
    getSkills().catch(() => []),
  ]);

  return (
    <AppShell>
      <VideoAnalysis
        videoId={videoId}
        url={url}
        title={title ?? dict["youtube.watch.untitled"]}
        channel={channel ?? null}
        initialNotes={notes}
        skills={skills}
        dict={dict}
      />
    </AppShell>
  );
}
