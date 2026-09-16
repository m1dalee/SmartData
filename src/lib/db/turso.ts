import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";
import * as schema from "./schema";
import { seedDefaultCategories } from "./seed-categories";
import { getTursoEnv } from "./config";
import type { SmartDataDb } from "./types";

let dbInstance: SmartDataDb | null = null;

export async function initTursoDatabase(): Promise<SmartDataDb> {
  if (dbInstance) return dbInstance;

  const { url, authToken } = getTursoEnv();
  if (!url || !authToken) {
    throw new Error(
      "Base Turso non configurée (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN ou LIBSQL_URL + LIBSQL_AUTH_TOKEN).",
    );
  }

  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });
  const migrationsFolder = path.join(process.cwd(), "drizzle");

  await migrate(db, { migrationsFolder });
  await seedDefaultCategories(db as unknown as SmartDataDb);

  dbInstance = db as unknown as SmartDataDb;
  return dbInstance;
}
