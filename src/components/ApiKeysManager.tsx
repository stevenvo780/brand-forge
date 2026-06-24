"use client";

import { useCallback, useEffect, useState } from "react";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const inputCls =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200";

export default function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [scopes, setScopes] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [created, setCreated] = useState<{ raw: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/api-keys", { cache: "no-store" });
      const b = await res.json().catch(() => ({}));
      if (res.ok) {
        setKeys(b.keys ?? []);
        setScopes(b.scopes ?? []);
        setSelected((prev) => (prev.length ? prev : (b.scopes ?? [])));
      } else {
        setError(b.error || `Error ${res.status}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(scope: string) {
    setSelected((s) => (s.includes(scope) ? s.filter((x) => x !== scope) : [...s, scope]));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scopes: selected }),
    });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(b.error || `Error ${res.status}`);
      return;
    }
    setCreated({ raw: b.raw, name });
    setName("");
    await load();
  }

  async function onRevoke(id: string) {
    if (!confirm("¿Revocar esta API key? No se puede deshacer.")) return;
    const res = await fetch(`/api/settings/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Nueva API key</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-400">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 ${inputCls}`} placeholder="ej: Integración web" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400">Scopes</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {scopes.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm text-neutral-300">
                  <input type="checkbox" checked={selected.includes(s)} onChange={() => toggle(s)} />
                  <span className="font-mono text-xs">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || selected.length === 0}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          Generar key
        </button>
      </form>

      {created && (
        <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-5">
          <p className="text-sm text-emerald-200">
            Key <span className="font-medium">{created.name}</span> creada. Copiala ahora — no se vuelve a mostrar:
          </p>
          <code className="mt-2 block overflow-auto rounded-lg bg-neutral-950 px-3 py-2 font-mono text-sm text-emerald-300">
            {created.raw}
          </code>
        </div>
      )}

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Keys</h2>
        {loading ? (
          <p className="mt-4 text-sm text-neutral-500">Cargando…</p>
        ) : keys.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Sin keys todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-800">
            {keys.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    {k.name}
                    {k.revoked_at && <span className="ml-2 text-xs text-red-300">(revocada)</span>}
                  </p>
                  <p className="font-mono text-xs text-neutral-500">{k.prefix}… · {k.scopes.join(", ")}</p>
                </div>
                <span className="text-xs text-neutral-600">
                  {k.last_used_at ? `Usada ${new Date(k.last_used_at).toLocaleString("es-CO")}` : "Nunca usada"}
                </span>
                {!k.revoked_at && (
                  <button onClick={() => onRevoke(k.id)} className="ml-auto text-xs text-neutral-500 hover:text-red-300">
                    Revocar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
