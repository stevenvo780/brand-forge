"use client";

import { useCallback, useEffect, useState } from "react";

type TemplateMeta = { id: string; label: string; width: number; height: number };

type Asset = {
  id: string;
  url: string;
  meta: { template?: string; width?: number; height?: number };
  created_at: string;
};

export default function ImageGenerator({
  slug,
  templates,
}: {
  slug: string;
  templates: TemplateMeta[];
}) {
  const [template, setTemplate] = useState(templates[0]?.id ?? "");
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  const loadAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${slug}/images`, { cache: "no-store" });
      if (res.ok) {
        const body = await res.json();
        setAssets(body.assets ?? []);
      }
    } catch {
      // Non-fatal: gallery just stays empty.
    } finally {
      setLoadingAssets(false);
    }
  }, [slug]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/brands/${slug}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, fields: { titulo, subtitulo } }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || `Error ${res.status}`);
        return;
      }
      await loadAssets();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Generar imagen
      </h2>

      <form onSubmit={onGenerate} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-400">Plantilla</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.width}×{t.height})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Texto principal"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400">Subtítulo</label>
          <input
            value={subtitulo}
            onChange={(e) => setSubtitulo(e.target.value)}
            placeholder="Texto secundario"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !template}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generando…" : "Generar"}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Galería
        </h3>
        {loadingAssets ? (
          <p className="mt-3 text-sm text-neutral-500">Cargando…</p>
        ) : assets.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Aún no hay imágenes generadas.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {assets.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.meta?.template || "asset"}
                  className="aspect-square w-full object-cover transition group-hover:opacity-90"
                />
                <div className="px-2 py-1 text-[11px] text-neutral-500">
                  {a.meta?.template}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
