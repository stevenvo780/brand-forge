import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { revokeApiKey } from "@/lib/apikeys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { id } = await params;
  try {
    const ok = await revokeApiKey(id);
    if (!ok) return NextResponse.json({ error: "Key no encontrada o ya revocada" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
