import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  getDatabaseMode,
  getDb,
  getTursoDatabaseHost,
  isEphemeralServerlessDatabase,
  isTursoConfigured,
} from "@/lib/db";
import { transactions, userSettings } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const [txStats] = await db
      .select({
        total: sql<number>`count(*)`,
        imported: sql<number>`sum(case when ${transactions.source} = 'import' then 1 else 0 end)`,
      })
      .from(transactions);
    const [settings] = await db.select().from(userSettings).limit(1);

    return NextResponse.json({
      ok: true,
      mode: getDatabaseMode(),
      tursoConfigured: isTursoConfigured(),
      ephemeralOnVercel: isEphemeralServerlessDatabase(),
      vercel: process.env.VERCEL === "1",
      transactionCount: Number(txStats?.total ?? 0),
      importedTransactionCount: Number(txStats?.imported ?? 0),
      hasUserSettings: Boolean(settings),
      totalSavingsBalance: settings?.totalSavingsBalance ?? null,
      databaseHost: isTursoConfigured() ? getTursoDatabaseHost() : null,
      hint: isEphemeralServerlessDatabase()
        ? "Pas de Turso : chaque redémarrage serveur peut effacer la base /tmp. Ajoute l'intégration Turso sur Vercel et redeploie."
        : isTursoConfigured()
          ? "Turso actif : les données doivent persister entre les visites."
          : "SQLite locale (dev).",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        tursoConfigured: isTursoConfigured(),
        ephemeralOnVercel: isEphemeralServerlessDatabase(),
        error: message,
      },
      { status: 500 },
    );
  }
}
