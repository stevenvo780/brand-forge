import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  checkCredentials,
  issueSessionToken,
} from "@/lib/auth";

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

  const token = await issueSessionToken();
  if (!token) {
    // Production without SESSION_SECRET (or ADMIN_* unset) — refuse to issue.
    return NextResponse.json(
      { error: "Servidor mal configurado: falta SESSION_SECRET" },
      { status: 500 }
    );
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });

  return NextResponse.json({ ok: true });
}
