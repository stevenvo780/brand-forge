// Single-user cookie auth helpers. Shared between the login route and middleware.
// The session cookie stores the server's SESSION_SECRET; only code with access
// to the env can mint a valid cookie. httpOnly keeps it out of client JS.

export const SESSION_COOKIE = "bf_session";

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

export function checkCredentials(user: string, pass: string): boolean {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASS || "changeme";
  return user === expectedUser && pass === expectedPass;
}

export function isValidSession(cookieValue: string | undefined): boolean {
  return Boolean(cookieValue) && cookieValue === getSessionSecret();
}
