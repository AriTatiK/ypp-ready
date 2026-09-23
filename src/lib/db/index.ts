import { createClient, type Client, type InArgs } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

// Single shared libSQL connection for the whole app.
//
// In production, set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) to point at a
// hosted Turso database — this is what makes the app deployable on stateless
// hosts (Render, etc.) that don't offer a persistent local disk.
//
// With no TURSO_DATABASE_URL set (e.g. local development), it falls back to
// a local SQLite file at data/ypp.db, so `npm run dev` stays zero-config.
//
// Kept as a global so Next.js dev-mode hot-reload doesn't open a new
// connection (and re-run schema bootstrap) on every module reload.

declare global {
  // eslint-disable-next-line no-var
  var __yppDb: Client | undefined;
  // eslint-disable-next-line no-var
  var __yppDbReady: Promise<void> | undefined;
}

function createLocalFileClient(): Client {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "ypp.db");
  return createClient({ url: `file:${dbPath}` });
}

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  // No Turso configured — use a local SQLite file. Fine for local dev; not
  // suitable for a stateless production host (the file won't persist).
  return createLocalFileClient();
}

// Columns added to `lessons` after the table may already exist on a
// previously-seeded database (e.g. an already-deployed Turso instance).
// `CREATE TABLE IF NOT EXISTS` won't add these retroactively, so they're
// added here, one ALTER TABLE per column, each ignored if it already exists.
const LESSON_MIGRATION_COLUMNS = [
  "african_context_en TEXT",
  "african_context_fr TEXT",
  "technical_terms_json TEXT",
  "concrete_example_en TEXT",
  "concrete_example_fr TEXT",
  "one_line_summary_en TEXT",
  "one_line_summary_fr TEXT",
  "qcm_reflex_en TEXT",
  "qcm_reflex_fr TEXT",
  "structured_sections_json TEXT",
];

async function bootstrap(client: Client): Promise<void> {
  const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await client.executeMultiple(schema);

  for (const columnDef of LESSON_MIGRATION_COLUMNS) {
    try {
      await client.execute(`ALTER TABLE lessons ADD COLUMN ${columnDef}`);
    } catch {
      // Column already exists — fine, this runs on every cold start.
    }
  }
}

/** Returns the shared libSQL client, creating and bootstrapping it on first use. */
export function getDb(): Client {
  if (!global.__yppDb) {
    global.__yppDb = createDbClient();
  }
  return global.__yppDb;
}

/** Ensures the schema has been created. Must be awaited before the first query in a cold start. */
export function ready(): Promise<void> {
  if (!global.__yppDbReady) {
    global.__yppDbReady = bootstrap(getDb());
  }
  return global.__yppDbReady;
}

/** Runs a single statement and returns all rows, typed as T. */
export async function all<T = Record<string, unknown>>(sql: string, args: InArgs = []): Promise<T[]> {
  await ready();
  const rs = await getDb().execute({ sql, args });
  return rs.rows as unknown as T[];
}

/** Runs a single statement and returns the first row, or null. */
export async function get<T = Record<string, unknown>>(sql: string, args: InArgs = []): Promise<T | null> {
  const rows = await all<T>(sql, args);
  return rows[0] ?? null;
}

/** Runs a single statement (insert/update/delete) and returns rowsAffected + lastInsertRowid. */
export async function run(
  sql: string,
  args: InArgs = []
): Promise<{ rowsAffected: number; lastInsertRowid: bigint | undefined }> {
  await ready();
  const rs = await getDb().execute({ sql, args });
  return { rowsAffected: rs.rowsAffected, lastInsertRowid: rs.lastInsertRowid };
}

/** Runs several statements as a single atomic transaction (all-or-nothing). */
export async function batch(statements: { sql: string; args?: InArgs }[]): Promise<void> {
  await ready();
  await getDb().batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    "write"
  );
}
