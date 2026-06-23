// Single-user cookie auth helpers. Shared between the login route (Node runtime)
// and middleware (Edge runtime), so everything here uses Web Crypto + globals
// that exist in both — no Node-only `crypto` import.
//
// The session cookie is NOT the master secret. It's a stateless, signed token:
//   `${issuedAtMs}.${HMAC_SHA256(issuedAtMs, SESSION_SECRET)}`
// Middleware re-derives the HMAC and constant-time-compares it, then enforces a
// max age. Only code with SESSION_SECRET can mint a valid cookie.

export const SESSION_COOKIE = "bf_session";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
export const SESSION_MAX_AGE_SEC = SESSION_MAX_AGE_MS / 1000;

const isProd = () => process.env.NODE_ENV === "production";

/**
 * The signing secret, or null if the deployment is misconfigured. In production
 * SESSION_SECRET is mandatory; in dev we fall back to a constant so the app runs
 * out of the box.
 */
export function getSessionSecret(): string | null {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  return isProd() ? null : "dev-secret-change-me";
}

/** Admin credentials from env, or null if not configured (prod) / dev fallback. */
function getAdminCreds(): { user: string; pass: string } | null {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (user && pass) return { user, pass };
  if (!isProd()) return { user: "admin", pass: "changeme" };
  return null;
}

/** Length-independent constant-time string comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Compare a fixed amount of work regardless of length, then fold length in.
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

export function checkCredentials(user: string, pass: string): boolean {
  const creds = getAdminCreds();
  if (!creds) return false;
  // Evaluate both comparisons (no short-circuit) to avoid leaking which failed.
  const okUser = timingSafeEqual(user, creds.user);
  const okPass = timingSafeEqual(pass, creds.pass);
  return okUser && okPass;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Mint a signed session token, or null if the server lacks a secret. */
export async function issueSessionToken(): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) return null;
  const issued = String(Date.now());
  const sig = await hmacHex(secret, issued);
  return `${issued}.${sig}`;
}

/** Verify a session cookie: valid signature + within max age. */
export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = getSessionSecret();
  if (!secret) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const issued = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const ts = Number(issued);
  if (!Number.isFinite(ts) || Date.now() - ts > SESSION_MAX_AGE_MS) return false;

  const expected = await hmacHex(secret, issued);
  return timingSafeEqual(sig, expected);
}
