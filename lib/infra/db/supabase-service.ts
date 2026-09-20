import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./supabase-env";

/**
 * Service-role client. Bypasses RLS — use only for catalog writes
 * (Discipline, Skill, Achievement, Resource, SearchDocument, Embedding),
 * never for user-owned data.
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createSupabaseClient(getSupabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Anon-key client with no cookie/request binding — safe to call from inside
 * `unstable_cache` (unlike the cookie-bound `createClient` in
 * supabase-server.ts, which needs `next/headers` request scope). Only reads
 * data whose RLS policy already permits the anon role, e.g. the public
 * skills/disciplines catalog (see migration 17).
 */
export function createPublicClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false },
  });
}
