import { NextResponse } from "next/server";
import { createBrand, listBrands, isDbConfigured } from "@/lib/brands";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  try {
    const brands = await listBrands();
    return NextResponse.json({ brands });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }

  let body: { name?: string; slug?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const slug = (body.slug || "").trim();
  const data = body.data && typeof body.data === "object" ? body.data : {};

  if (!name || !slug) {
    return NextResponse.json({ error: "name y slug son obligatorios" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "slug solo puede contener minúsculas, números y guiones" },
      { status: 400 }
    );
  }

  try {
    const brand = await createBrand({ name, slug, data });
    return NextResponse.json({ brand }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("duplicate key")) {
      return NextResponse.json({ error: "Ya existe una marca con ese slug" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
