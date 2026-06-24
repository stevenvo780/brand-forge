import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { listContacts, createContact } from "@/lib/crm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const orgId = new URL(req.url).searchParams.get("org") || undefined;
  try {
    return NextResponse.json({ contacts: await listContacts(orgId) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  let body: { org_id?: string; name?: string; email?: string; phone?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const org_id = (body.org_id || "").trim();
  const name = (body.name || "").trim();
  if (!org_id || !name) {
    return NextResponse.json({ error: "org_id y name son obligatorios" }, { status: 400 });
  }

  try {
    const contact = await createContact({
      org_id,
      name,
      email: (body.email || "").trim() || null,
      phone: (body.phone || "").trim() || null,
      role: (body.role || "").trim() || null,
    });
    return NextResponse.json({ contact }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (/foreign key/i.test(msg)) {
      return NextResponse.json({ error: "El cliente indicado no existe" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
