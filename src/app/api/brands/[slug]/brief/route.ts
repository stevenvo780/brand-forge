import { NextResponse } from "next/server";
import { getBrandBySlug, mergeBrandData, isDbConfigured } from "@/lib/brands";
import { brandBrief, isAiConfigured, type BrandBrief } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Map a generated brief onto the brand.data shape consumed elsewhere:
 *  - data.brief        full brief (shown in the "Identidad IA" UI)
 *  - data.colors       { primary, secondary, ... } so templates/cards use it
 *  - data.slogan       picked up by image templates
 *  - data.typography   { fontFamily } shown on the brand page
 */
function briefToPatch(brief: BrandBrief): Record<string, unknown> {
  const colors: Record<string, string> = {};
  const names = ["primary", "secondary", "accent", "neutral", "extra"];
  brief.palette.forEach((c, i) => {
    colors[names[i] ?? `color${i + 1}`] = c.hex;
  });
  return {
    brief,
    colors,
    slogan: brief.slogan,
    typography: { fontFamily: brief.fonts.heading, body: brief.fonts.body },
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 503 });
  }

  const { slug } = await params;

  let body: { industry?: string; keywords?: string; targetAudience?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const brand = await getBrandBySlug(slug);
  if (!brand) {
    return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 });
  }

  try {
    const brief = await brandBrief({
      brandName: brand.name,
      industry: (body.industry || "").trim(),
      keywords: (body.keywords || "").trim(),
      targetAudience: (body.targetAudience || "").trim(),
    });

    const updated = await mergeBrandData(slug, briefToPatch(brief));
    return NextResponse.json({ brief, data: updated?.data ?? {} });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
