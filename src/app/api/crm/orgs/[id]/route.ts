import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import {
  getOrgDetail,
  updateOrg,
  deleteOrg,
  assignBrandToOrg,
  listUnassignedBrands,
} from "@/lib/crm";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { id } = await params;
  try {
    const detail = await getOrgDetail(id);
    if (!detail) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    const unassignedBrands = await listUnassignedBrands();
    return NextResponse.json({ ...detail, unassignedBrands });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { id } = await params;
  let body: {
    name?: string;
    industry?: string;
    website?: string;
    notes?: string;
    assignBrandId?: string;
    unassignBrandId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    // Brand assignment / unassignment is a distinct action on the same resource.
    if (body.assignBrandId) {
      await assignBrandToOrg(body.assignBrandId, id);
    }
    if (body.unassignBrandId) {
      await assignBrandToOrg(body.unassignBrandId, null);
    }

    const hasOrgFields =
      body.name !== undefined ||
      body.industry !== undefined ||
      body.website !== undefined ||
      body.notes !== undefined;

    if (hasOrgFields) {
      const org = await updateOrg(id, {
        name: body.name?.trim() || undefined,
        industry: body.industry?.trim() ?? undefined,
        website: body.website?.trim() ?? undefined,
        notes: body.notes?.trim() ?? undefined,
      });
      if (!org) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const detail = await getOrgDetail(id);
    return NextResponse.json(detail);
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
    const ok = await deleteOrg(id);
    if (!ok) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
