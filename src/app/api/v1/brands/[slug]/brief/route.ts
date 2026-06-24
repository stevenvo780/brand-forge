import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/v1auth";
import { getBrandBySlug, mergeBrandData } from "@/lib/brands";
import { brandBrief, isAiConfigured, type BrandBrief } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireApiKey(req, "brief:write");
  if ("response" in auth) return auth.response;

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
    await mergeBrandData(slug, briefToPatch(brief));
    return NextResponse.json({ brief });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
