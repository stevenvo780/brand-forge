import { NextResponse } from "next/server";
import { getBrandBySlug, isDbConfigured } from "@/lib/brands";
import { createJob } from "@/lib/jobs";
import { processReelJob, isReelStyle, type ReelStyle } from "@/lib/reels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Generous ceiling for the in-request portion; the render runs detached.
export const maxDuration = 300;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { slug } = await params;

  let body: { duration?: number; style?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const brand = await getBrandBySlug(slug);
  if (!brand) {
    return NextResponse.json({ error: "Marca no encontrada" }, { status: 404 });
  }

  const style: ReelStyle = body.style && isReelStyle(body.style) ? body.style : "fade";
  const duration = Math.min(15, Math.max(2, Number(body.duration) || 5));
  const text = (body.text || "").trim();

  try {
    const job = await createJob(brand.id, "reel", { duration, style, text });
    // Detached processing — completes thanks to Cloud Run's no-cpu-throttling.
    // The reel-worker.ts script is a fallback that polls for stuck jobs.
    void processReelJob(job).catch(() => {
      /* status is recorded as 'failed' inside processReelJob */
    });
    return NextResponse.json({ job }, { status: 202 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
