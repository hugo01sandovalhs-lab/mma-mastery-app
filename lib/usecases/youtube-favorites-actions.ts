"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import type { VideoSearchResult } from "@/lib/domain/video-search";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function addVideoFavorite(video: VideoSearchResult): Promise<{ id: string }> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("resources")
    .insert({ user_id: userId, type: "video", title: video.title, author: video.channelTitle, url: video.url })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/youtube");
  return { id: data.id as string };
}

export async function removeVideoFavorite(resourceId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("resources").delete().eq("id", resourceId);
  if (error) throw new Error(error.message);
  revalidatePath("/youtube");
}
