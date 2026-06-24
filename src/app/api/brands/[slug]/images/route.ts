import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { generateBrandImage, listBrandAssets } from "@/lib/images";
import { isKnownTemplate, type TemplateFields } from "@/lib/templates";

export const dynamic = "force-dynamic";
// Rendering with chromium needs the Node.js runtime, not the Edge runtime.
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { slug } = await params;
  try {
    const assets = await listBrandAssets(slug);
    return NextResponse.json({ assets });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { slug } = await params;

  let body: { template?: string; fields?: TemplateFields };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const template = (body.template || "").trim();
  if (!template || !isKnownTemplate(template)) {
    return NextResponse.json({ error: "Plantilla inválida o desconocida" }, { status: 400 });
  }

  const fields: TemplateFields = {
    titulo: typeof body.fields?.titulo === "string" ? body.fields.titulo : "",
    subtitulo: typeof body.fields?.subtitulo === "string" ? body.fields.subtitulo : "",
  };

  try {
    const asset = await generateBrandImage(slug, template, fields);
    return NextResponse.json({ asset, url: asset.url }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = /no encontrada/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
