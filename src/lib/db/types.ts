import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "./schema";

/** Shared Drizzle API surface (local SQLite + Turso/libSQL). */
export type SmartDataDb = BetterSQLite3Database<typeof schema>;
