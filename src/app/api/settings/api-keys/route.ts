import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { listApiKeys, createApiKey, isScope, API_SCOPES, type ApiScope } from "@/lib/apikeys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  try {
    return NextResponse.json({ keys: await listApiKeys(), scopes: API_SCOPES });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  let body: { name?: string; scopes?: string[]; orgId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "name es obligatorio" }, { status: 400 });
  }
  const scopes: ApiScope[] = Array.isArray(body.scopes)
    ? body.scopes.filter(isScope)
    : [...API_SCOPES];
  if (scopes.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos un scope" }, { status: 400 });
  }

  try {
    const { key, raw } = await createApiKey(name, scopes, (body.orgId || "").trim() || null);
    return NextResponse.json({ key, raw }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
