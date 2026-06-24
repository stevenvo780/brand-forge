import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { listBrandJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const { slug } = await params;
  try {
    const jobs = await listBrandJobs(slug, "reel");
    return NextResponse.json({ jobs });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
