import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { listOrgs, createOrg } from "@/lib/crm";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  try {
    return NextResponse.json({ orgs: await listOrgs() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  let body: { name?: string; slug?: string; industry?: string; website?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "name es obligatorio" }, { status: 400 });
  }
  const slug = (body.slug || "").trim() || slugify(name);
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "slug inválido" }, { status: 400 });
  }

  try {
    const org = await createOrg({
      name,
      slug,
      industry: (body.industry || "").trim() || null,
      website: (body.website || "").trim() || null,
      notes: (body.notes || "").trim() || null,
    });
    return NextResponse.json({ org }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("duplicate key")) {
      return NextResponse.json({ error: "Ya existe un cliente con ese slug" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
