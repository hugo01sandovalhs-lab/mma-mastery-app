import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase-env";

/**
 * Cached per request: every page/usecase calls createClient() independently,
 * and each then calls supabase.auth.getUser(), which is a network round trip
 * to the Supabase Auth server. Without this, a single page render could fire
 * that round trip a dozen times in parallel. React's cache() dedupes both the
 * client construction and the getUser() call across one request.
 */
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component; session refresh is handled by middleware.
        }
      },
    },
  });

  const getUser = supabase.auth.getUser.bind(supabase.auth);
  supabase.auth.getUser = cache(() => getUser());

  return supabase;
});
