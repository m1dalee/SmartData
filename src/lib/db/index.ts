import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "smartdata.db");

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqliteInstance: Database.Database | null = null;

const defaultCategories = [
  { name: "Alimentation", icon: "shopping-cart", color: "#f97316", type: "expense" as const },
  { name: "Transport", icon: "car", color: "#3b82f6", type: "expense" as const },
  { name: "Logement", icon: "home", color: "#8b5cf6", type: "expense" as const },
  { name: "Loisirs", icon: "gamepad-2", color: "#ec4899", type: "expense" as const },
  { name: "Santé", icon: "heart-pulse", color: "#ef4444", type: "expense" as const },
  { name: "Shopping", icon: "shopping-bag", color: "#14b8a6", type: "expense" as const },
  { name: "Abonnements", icon: "repeat", color: "#6366f1", type: "expense" as const },
  { name: "Mouvement d'argent", icon: "arrow-left-right", color: "#0ea5e9", type: "expense" as const },
  { name: "Salaire", icon: "wallet", color: "#22c55e", type: "income" as const },
  { name: "Autres revenus", icon: "trending-up", color: "#10b981", type: "income" as const },
  { name: "Autres dépenses", icon: "tag", color: "#64748b", type: "expense" as const },
];

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

function runMigrations(sqlite: Database.Database, db: ReturnType<typeof drizzle<typeof schema>>) {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (!fs.existsSync(migrationsFolder)) return;

  const savingsGoalColumns = sqlite
    .prepare("PRAGMA table_info(savings_goals)")
    .all() as { name: string }[];

  if (savingsGoalColumns.some((column) => column.name === "starting_amount")) {
    markMigrationApplied(sqlite, migrationsFolder, "0002_smiling_hellion.sql");
  }

  try {
    migrate(db, { migrationsFolder });
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

function ensureDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqliteInstance = sqlite;

  const db = drizzle(sqlite, { schema });
  runMigrations(sqlite, db);

  const count = sqlite.prepare("SELECT COUNT(*) as count FROM categories").get() as {
    count: number;
  };

  if (count.count === 0) {
    const insert = sqlite.prepare(
      "INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)",
    );
    for (const category of defaultCategories) {
      insert.run(category.name, category.icon, category.color, category.type);
    }
  } else {
    const existing = sqlite
      .prepare("SELECT name FROM categories WHERE name = ?")
      .get("Mouvement d'argent") as { name: string } | undefined;
    if (!existing) {
      sqlite
        .prepare("INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)")
        .run("Mouvement d'argent", "arrow-left-right", "#0ea5e9", "expense");
    }
  }

  return db;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = ensureDatabase();
  }
  return dbInstance;
}

/** Flush WAL into the main DB file so imports survive process restarts. */
export function checkpointDatabase() {
  getDb();
  sqliteInstance?.pragma("wal_checkpoint(TRUNCATE)");
}
