import "server-only";

import { eq, sql } from "drizzle-orm";
import {
  getDatabaseMode,
  getTursoDatabaseHost,
  isEphemeralServerlessDatabase,
  isTursoConfigured,
} from "./config";
import type { SmartDataDb } from "./types";
import { transactions, userSettings } from "./schema";
import { ensureUserSettings } from "@/lib/monthly-plan";

export type DatabaseIdentity = {
  mode: "turso" | "local";
  host: string | null;
  ephemeral: boolean;
};

export function getDatabaseIdentity(): DatabaseIdentity {
  return {
    mode: getDatabaseMode(),
    host: isTursoConfigured() ? getTursoDatabaseHost() : null,
    ephemeral: isEphemeralServerlessDatabase(),
  };
}

export type ImportPersistenceStatus = {
  currentImportCount: number;
  lastRecordedImportCount: number | null;
  lastImportCompletedAt: string | null;
  recordedDatabaseHost: string | null;
  currentDatabaseHost: string | null;
  databaseHostMismatch: boolean;
  dataLossSuspected: boolean;
  ephemeralWarning: boolean;
};

export async function getImportPersistenceStatus(db: SmartDataDb): Promise<ImportPersistenceStatus> {
  await ensureUserSettings();
  const identity = getDatabaseIdentity();

  const [txRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.source, "import"));

  const [settings] = await db.select().from(userSettings).limit(1);
  const currentImportCount = Number(txRow?.count ?? 0);
  const lastRecordedImportCount = settings?.lastImportTransactionCount ?? null;
  const recordedDatabaseHost = settings?.tursoDatabaseHost ?? null;
  const currentDatabaseHost =
    identity.mode === "turso" ? identity.host : identity.ephemeral ? "ephemeral-vercel" : "local";

  const databaseHostMismatch = Boolean(
    identity.mode === "turso" &&
      recordedDatabaseHost &&
      identity.host &&
      recordedDatabaseHost !== identity.host,
  );

  const dataLossSuspected = Boolean(
    lastRecordedImportCount != null &&
      lastRecordedImportCount > 0 &&
      currentImportCount === 0,
  );

  return {
    currentImportCount,
    lastRecordedImportCount,
    lastImportCompletedAt: settings?.lastImportCompletedAt ?? null,
    recordedDatabaseHost,
    currentDatabaseHost,
    databaseHostMismatch,
    dataLossSuspected,
    ephemeralWarning: identity.ephemeral,
  };
}

export async function recordSuccessfulImport(db: SmartDataDb) {
  await ensureUserSettings();
  const identity = getDatabaseIdentity();

  const [txRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.source, "import"));

  const count = Number(txRow?.count ?? 0);
  const now = new Date().toISOString();
  const host =
    identity.mode === "turso"
      ? identity.host
      : identity.ephemeral
        ? "ephemeral-vercel"
        : "local";

  const [existing] = await db.select().from(userSettings).limit(1);
  if (!existing) return;

  await db
    .update(userSettings)
    .set({
      lastImportTransactionCount: count,
      lastImportCompletedAt: now,
      tursoDatabaseHost: host,
      updatedAt: now,
    })
    .where(eq(userSettings.id, existing.id));
}

export async function clearImportPersistenceMeta(db: SmartDataDb) {
  await ensureUserSettings();
  const [existing] = await db.select().from(userSettings).limit(1);
  if (!existing) return;

  await db
    .update(userSettings)
    .set({
      lastImportTransactionCount: 0,
      lastImportCompletedAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userSettings.id, existing.id));
}
