import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
}

// Admin client — bypasses RLS. Use only in trusted server code that has
// already authenticated the caller.
export function getSupabaseAdmin(): SupabaseClient {
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(supabaseUrl!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// RLS-scoped client — forwards a Clerk-issued Supabase JWT so Postgres sees
// `auth.jwt() ->> 'sub'` as the Clerk user id. Use this when you want RLS to
// enforce ownership instead of doing the check in application code.
export function getSupabaseForUser(token: string): SupabaseClient {
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured");
  }
  return createClient(supabaseUrl!, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
