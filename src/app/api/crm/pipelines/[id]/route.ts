import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { updatePipeline, deletePipeline, isStage } from "@/lib/crm";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { id } = await params;
  let body: { stage?: string; value?: number; notes?: string; contact_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.stage !== undefined && !isStage(body.stage)) {
    return NextResponse.json({ error: "stage inválido" }, { status: 400 });
  }

  try {
    const pipeline = await updatePipeline(id, {
      stage: body.stage !== undefined && isStage(body.stage) ? body.stage : undefined,
      value: Number.isFinite(body.value) ? Number(body.value) : undefined,
      notes: body.notes?.trim() ?? undefined,
      contact_id: body.contact_id?.trim() || undefined,
    });
    if (!pipeline) return NextResponse.json({ error: "Pipeline no encontrado" }, { status: 404 });
    return NextResponse.json({ pipeline });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { id } = await params;
  try {
    const ok = await deletePipeline(id);
    if (!ok) return NextResponse.json({ error: "Pipeline no encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
