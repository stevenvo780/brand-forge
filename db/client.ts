import { Pool, type QueryResult, type QueryResultRow } from "pg";

// Lazily-created singleton pool. If DATABASE_URL is not set, the app still
// boots — DB-backed pages/handlers surface a friendly "not configured" state.
let pool: Pool | null = null;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool | null {
  if (!isDbConfigured()) return null;
  if (!pool) {
    const connectionString = process.env.DATABASE_URL as string;
    // Cloud SQL public IP enforces SSL (hostssl in pg_hba). The server cert is
    // Google-managed; we encrypt in transit without pinning the CA for the MVP.
    const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
    const ssl =
      process.env.DB_SSL === "false" || isLocal
        ? undefined
        : { rejectUnauthorized: false };
    pool = new Pool({ connectionString, ssl });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const p = getPool();
  if (!p) {
    throw new Error("DATABASE_URL is not configured");
  }
  return p.query<T>(text, params as never[]);
}
