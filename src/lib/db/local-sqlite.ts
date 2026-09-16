import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import * as schema from "./schema";
import { seedDefaultCategories } from "./seed-categories";
import type { SmartDataDb } from "./types";

const dataDir =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "smartdata")
    : path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "smartdata.db");

let sqliteInstance: Database.Database | null = null;
let dbInstance: SmartDataDb | null = null;

function markMigrationApplied(
  sqlite: Database.Database,
  migrationsFolder: string,
  filename: string,
) {
  const filePath = path.join(migrationsFolder, filename);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  const existing = sqlite
    .prepare("SELECT hash FROM __drizzle_migrations WHERE hash = ?")
    .get(hash) as { hash: string } | undefined;

  if (!existing) {
    sqlite
      .prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)")
      .run(hash, Date.now());
  }
}

function runMigrations(sqlite: Database.Database, db: SmartDataDb) {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (!fs.existsSync(migrationsFolder)) return;

  const savingsGoalColumns = sqlite
    .prepare("PRAGMA table_info(savings_goals)")
    .all() as { name: string }[];

  if (savingsGoalColumns.some((column) => column.name === "starting_amount")) {
    markMigrationApplied(sqlite, migrationsFolder, "0002_smiling_hellion.sql");
  }

  try {
    migrate(db as ReturnType<typeof drizzle<typeof schema>>, { migrationsFolder });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const cause =
      error instanceof Error && error.cause instanceof Error ? error.cause.message : "";

    if (message.includes("duplicate column") || cause.includes("duplicate column")) {
      markMigrationApplied(sqlite, migrationsFolder, "0002_smiling_hellion.sql");
      return;
    }

    throw error;
  }
}

export function ensureLocalDatabase(): SmartDataDb {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqliteInstance = sqlite;

  const db = drizzle(sqlite, { schema });
  runMigrations(sqlite, db);
  dbInstance = db;
  return db;
}

export async function initLocalDatabase(): Promise<SmartDataDb> {
  const db = ensureLocalDatabase();
  await seedDefaultCategories(db);
  return db;
}

export function checkpointLocalDatabase() {
  ensureLocalDatabase();
  sqliteInstance?.pragma("wal_checkpoint(TRUNCATE)");
}
