import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

/**
 * Lazily-constructed Drizzle client for the messaging service.
 *
 * Reads POSTGRES_URL at first call so that importing this module (e.g. during
 * tests that only exercise the HTTP layer via Fastify `inject`) never
 * attempts to connect to a database. Per B.0 scope, no migrations run yet —
 * the schema is empty until B.1.
 */
let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (_db) return _db;
  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "POSTGRES_URL is not set. Configure it in apps/messaging/.env (see .env.example).",
    );
  }
  const client = postgres(url, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}
