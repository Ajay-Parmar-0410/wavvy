import "dotenv/config";
import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

// Load .env.local explicitly (dotenv/config only reads .env).
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing — ensure .env.local is present");
  process.exit(1);
}

const migrationsDir = path.resolve("drizzle");
// Allow running a single migration: `node scripts/migrate.mjs 0001_rls.sql`.
// Without an arg, applies every *.sql in order — fine for a fresh DB, but
// re-runs will fail on "already exists". Pass the specific file name to
// re-run a single migration safely.
const cliArg = process.argv[2];
const files = cliArg
  ? [cliArg]
  : fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

const sql = postgres(url, { prepare: false, max: 1 });

try {
  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const content = fs.readFileSync(full, "utf8");
    console.log(`→ applying ${file}`);
    // drizzle-kit emits `--> statement-breakpoint` separators between
    // statements; some DDL (CREATE INDEX) can't run alongside others in a
    // single implicit transaction, so we split and run one at a time.
    const statements = content
      .split(/-->\s*statement-breakpoint/g)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await sql.unsafe(stmt);
    }
    console.log(`  ✓ ${file}`);
  }
  console.log("All migrations applied.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
