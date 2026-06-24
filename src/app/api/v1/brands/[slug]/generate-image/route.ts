import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/v1auth";
import { generateBrandImage } from "@/lib/images";
import { isKnownTemplate, type TemplateFields } from "@/lib/templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireApiKey(req, "images:write");
  if ("response" in auth) return auth.response;

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
    return NextResponse.json({ url: asset.url, asset });
  } catch (e) {
    const msg = (e as Error).message;
    const status = /no encontrada/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
