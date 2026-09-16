import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "path";
import * as schema from "./schema";
import { seedDefaultCategories } from "./seed-categories";
import type { SmartDataDb } from "./types";

let dbInstance: SmartDataDb | null = null;

export function isTursoConfigured() {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export async function initTursoDatabase(): Promise<SmartDataDb> {
  if (dbInstance) return dbInstance;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    throw new Error("TURSO_DATABASE_URL et TURSO_AUTH_TOKEN sont requis pour la base distante.");
  }

  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });
  const migrationsFolder = path.join(process.cwd(), "drizzle");

  await migrate(db, { migrationsFolder });
  await seedDefaultCategories(db as unknown as SmartDataDb);

  dbInstance = db as unknown as SmartDataDb;
  return dbInstance;
}
