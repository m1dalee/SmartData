/** Variables Turso / libSQL (Vercel Marketplace ou Turso CLI). */
export function getTursoEnv() {
  const url =
    process.env.TURSO_DATABASE_URL?.trim() ||
    process.env.LIBSQL_URL?.trim() ||
    process.env.TURSO_URL?.trim() ||
    "";
  const authToken =
    process.env.TURSO_AUTH_TOKEN?.trim() || process.env.LIBSQL_AUTH_TOKEN?.trim() || "";
  return { url: url || undefined, authToken: authToken || undefined };
}

export function isTursoConfigured() {
  const { url, authToken } = getTursoEnv();
  return Boolean(url && authToken);
}

export function getDatabaseMode(): "turso" | "local" {
  if (isTursoConfigured()) return "turso";
  return "local";
}

/** Sur Vercel sans Turso : SQLite dans /tmp → données perdues entre cold starts. */
export function isEphemeralServerlessDatabase() {
  return process.env.VERCEL === "1" && !isTursoConfigured();
}

/** Host Turso affiché dans /api/health/db (sans secrets). */
export function getTursoDatabaseHost(): string | null {
  const { url } = getTursoEnv();
  if (!url) return null;
  const withoutScheme = url.replace(/^libsql:\/\//, "").replace(/^https:\/\//, "");
  const host = withoutScheme.split(/[/?#]/)[0]?.trim();
  return host || null;
}
