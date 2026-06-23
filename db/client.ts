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
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
