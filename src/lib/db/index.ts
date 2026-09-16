import { initLocalDatabase, checkpointLocalDatabase } from "./local-sqlite";
import { initTursoDatabase, isTursoConfigured } from "./turso";
import type { SmartDataDb } from "./types";

let dbPromise: Promise<SmartDataDb> | null = null;

function resolveDatabase(): Promise<SmartDataDb> {
  if (!dbPromise) {
    dbPromise = isTursoConfigured() ? initTursoDatabase() : initLocalDatabase();
  }
  return dbPromise;
}

export async function getDb(): Promise<SmartDataDb> {
  return resolveDatabase();
}

/** Flush WAL into the main DB file (local SQLite only). */
export function checkpointDatabase() {
  if (isTursoConfigured()) return;
  checkpointLocalDatabase();
}
