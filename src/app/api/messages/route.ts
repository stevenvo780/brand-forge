import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/brands";
import { sendMessage, listMessages, isChannel } from "@/lib/messaging";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  const sp = new URL(req.url).searchParams;
  try {
    const messages = await listMessages({
      orgId: sp.get("org") || undefined,
      contactId: sp.get("contact") || undefined,
    });
    return NextResponse.json({ messages });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 503 });
  }
  let body: { contactId?: string; channel?: string; subject?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const contactId = (body.contactId || "").trim();
  const channel = (body.channel || "").trim();
  const text = (body.body || "").trim();

  if (!contactId || !isChannel(channel) || !text) {
    return NextResponse.json(
      { error: "contactId, channel (email|whatsapp) y body son obligatorios" },
      { status: 400 }
    );
  }

  try {
    const result = await sendMessage({ contactId, channel, subject: body.subject, body: text });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = /no encontrado/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
