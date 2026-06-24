import { NextResponse } from "next/server";
import { verifyApiKey, type ApiKey, type ApiScope } from "./apikeys";
import { isDbConfigured } from "../../db/client";

/**
 * Guard for /api/v1/* handlers. Returns the authorized ApiKey, or a
 * NextResponse to return immediately on failure.
 */
export async function requireApiKey(
  req: Request,
  scope: ApiScope
): Promise<{ key: ApiKey } | { response: NextResponse }> {
  if (!isDbConfigured()) {
    return { response: NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 }) };
  }
  const raw = req.headers.get("x-api-key");
  const result = await verifyApiKey(raw, scope);
  if (!result.ok) {
    return { response: NextResponse.json({ error: result.error }, { status: result.status }) };
  }
  return { key: result.key };
}
