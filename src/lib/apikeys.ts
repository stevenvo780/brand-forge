import { createHash, randomBytes } from "node:crypto";
import { query } from "../../db/client";

export const API_SCOPES = ["brands:read", "images:write", "brief:write"] as const;
export type ApiScope = (typeof API_SCOPES)[number];

export type ApiKey = {
  id: string;
  org_id: string | null;
  name: string;
  prefix: string;
  scopes: ApiScope[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export function isScope(s: string): s is ApiScope {
  return (API_SCOPES as readonly string[]).includes(s);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export type CreatedApiKey = { key: ApiKey; raw: string };

/** Create a key. The raw secret is returned ONCE and never stored. */
export async function createApiKey(
  name: string,
  scopes: ApiScope[],
  orgId: string | null
): Promise<CreatedApiKey> {
  const raw = `bf_${randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 10);
  const hash = sha256(raw);
  const { rows } = await query<ApiKey>(
    `INSERT INTO api_keys (org_id, name, key_hash, prefix, scopes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, org_id, name, prefix, scopes, last_used_at, revoked_at, created_at`,
    [orgId, name, hash, prefix, scopes]
  );
  return { key: rows[0], raw };
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const { rows } = await query<ApiKey>(
    `SELECT id, org_id, name, prefix, scopes, last_used_at, revoked_at, created_at
       FROM api_keys ORDER BY created_at DESC`
  );
  return rows;
}

export async function revokeApiKey(id: string): Promise<boolean> {
  const { rowCount } = await query(
    `UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
    [id]
  );
  return (rowCount ?? 0) > 0;
}

export type VerifyResult =
  | { ok: true; key: ApiKey }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Verify a raw API key for a required scope. On success bumps last_used_at.
 */
export async function verifyApiKey(raw: string | null, scope: ApiScope): Promise<VerifyResult> {
  if (!raw) return { ok: false, status: 401, error: "Falta el header X-Api-Key" };
  const hash = sha256(raw.trim());
  const { rows } = await query<ApiKey>(
    `SELECT id, org_id, name, prefix, scopes, last_used_at, revoked_at, created_at
       FROM api_keys WHERE key_hash = $1`,
    [hash]
  );
  const key = rows[0];
  if (!key) return { ok: false, status: 401, error: "API key inválida" };
  if (key.revoked_at) return { ok: false, status: 401, error: "API key revocada" };
  if (!key.scopes.includes(scope)) {
    return { ok: false, status: 403, error: `La key no tiene el scope ${scope}` };
  }
  // Fire-and-forget usage bump; failure must not block the request, but log it
  // so DB issues (e.g. pool exhaustion) are still observable.
  query(`UPDATE api_keys SET last_used_at = now() WHERE id = $1`, [key.id]).catch((e) =>
    console.warn("[apikeys] last_used_at bump falló:", (e as Error).message)
  );
  return { ok: true, key };
}
