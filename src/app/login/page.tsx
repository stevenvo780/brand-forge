"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Only allow same-origin relative paths to avoid open redirects
  // (reject protocol-relative `//evil.com` and absolute URLs).
  const rawFrom = params.get("from") || "/";
  const from = rawFrom.startsWith("/") && !rawFrom.startsWith("//") ? rawFrom : "/";

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, pass }),
      });
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Credenciales inválidas");
      }
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8"
    >
      <h1 className="text-2xl font-bold">Brand Forge</h1>
      <p className="mt-1 text-sm text-neutral-400">Iniciá sesión para continuar.</p>

      <label className="mt-6 block text-sm font-medium text-neutral-300">
        Usuario
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          required
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-neutral-300">
        Clave
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          required
        />
      </label>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
