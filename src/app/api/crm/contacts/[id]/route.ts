import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { updateContact, deleteContact } from "@/lib/crm";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { id } = await params;
  let body: { name?: string; email?: string; phone?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  try {
    const contact = await updateContact(id, {
      name: body.name?.trim() || undefined,
      email: body.email?.trim() ?? undefined,
      phone: body.phone?.trim() ?? undefined,
      role: body.role?.trim() ?? undefined,
    });
    if (!contact) return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    return NextResponse.json({ contact });
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
    const ok = await deleteContact(id);
    if (!ok) return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
