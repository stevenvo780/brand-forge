import { NextResponse } from "next/server";
import { listBrands } from "@/lib/brands";
import { requireApiKey } from "@/lib/v1auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireApiKey(req, "brands:read");
  if ("response" in auth) return auth.response;

  try {
    const brands = await listBrands();
    return NextResponse.json({
      brands: brands.map((b) => ({ slug: b.slug, name: b.name, data: b.data })),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
