import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { createPipeline, isStage } from "@/lib/crm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  let body: { org_id?: string; contact_id?: string; stage?: string; value?: number; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const org_id = (body.org_id || "").trim();
  if (!org_id) {
    return NextResponse.json({ error: "org_id es obligatorio" }, { status: 400 });
  }
  const stage = body.stage && isStage(body.stage) ? body.stage : "lead";

  try {
    const pipeline = await createPipeline({
      org_id,
      contact_id: (body.contact_id || "").trim() || null,
      stage,
      value: Number.isFinite(body.value) ? Number(body.value) : 0,
      notes: (body.notes || "").trim() || null,
    });
    return NextResponse.json({ pipeline }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
