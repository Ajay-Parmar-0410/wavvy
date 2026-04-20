import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, schema } from "./db/client";

export interface AuthedUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

// Resolves the Clerk session and ensures a matching `users` row exists in
// Postgres. Returns null for signed-out requests. Callers downstream can
// safely key data on `user.id` — it is always the Clerk user id.
export async function getAuthedUser(): Promise<AuthedUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
    };
  }

  // First-time sign-in — mirror the Clerk user into Postgres so foreign keys
  // resolve. Clerk's `currentUser()` is the source of truth for profile data.
  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser?.primaryEmailAddressId,
    )?.emailAddress ?? null;
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    null;

  const inserted = await db
    .insert(schema.users)
    .values({ id: userId, email, displayName })
    .onConflictDoNothing()
    .returning();

  if (inserted.length > 0) {
    const row = inserted[0];
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
    };
  }

  return { id: userId, email, displayName };
}

export async function requireAuthedUser(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

// Returns the Clerk-issued Supabase JWT for the current session (requires a
// JWT template named "supabase" in the Clerk dashboard). Use this when you
// want the RLS-scoped Supabase client instead of the admin client.
export async function getSupabaseAccessToken(): Promise<string | null> {
  const { getToken } = await auth();
  return (await getToken({ template: "supabase" })) ?? null;
}
