import { NextResponse } from "next/server";
import { isDbConfigured } from "../../../../db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, db: isDbConfigured() });
}
