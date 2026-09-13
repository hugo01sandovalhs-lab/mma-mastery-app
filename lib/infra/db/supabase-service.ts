import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./supabase-env";

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
