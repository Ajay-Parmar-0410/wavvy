import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

// In Next.js dev mode, modules reload per request — cache the postgres client
// on globalThis to avoid exhausting the pool.
const globalForDb = globalThis as unknown as {
  __wavvy_pg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__wavvy_pg ??
  postgres(connectionString, {
    prepare: false, // Required for Supabase pgbouncer transaction mode
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__wavvy_pg = client;
}

export const db = drizzle(client, { schema });
export { schema };
