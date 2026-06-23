import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, checkCredentials, getSessionSecret } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { user?: string; pass?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { user = "", pass = "" } = body;
  if (!checkCredentials(user, pass)) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, getSessionSecret(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ ok: true });
}
