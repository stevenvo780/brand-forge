"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PaletteColor = { name: string; hex: string };
type Brief = {
  palette: PaletteColor[];
  fonts: { heading: string; body: string };
  slogan: string;
  tone: string;
  copy: string[];
};

export default function BrandBrief({ slug, initialBrief }: { slug: string; initialBrief: Brief | null }) {
  const router = useRouter();
  const [industry, setIndustry] = useState("");
  const [keywords, setKeywords] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<Brief | null>(initialBrief);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/brands/${slug}/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, keywords, targetAudience: audience }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || `Error ${res.status}`);
        return;
      }
      setBrief(body.brief as Brief);
      // Refresh the server-rendered colors/typography sections of the page.
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Identidad IA</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Generá paleta, tipografías, eslogan y tono con Gemini Flash.
      </p>

      <form onSubmit={onGenerate} className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-neutral-400">Industria</label>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="ej: alimentos"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400">Palabras clave</label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="ej: fresco, local, premium"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400">Público objetivo</label>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="ej: pymes, jóvenes"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          />
        </div>

        <div className="sm:col-span-3">
          {error && (
            <div className="mb-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generando identidad…" : "Generar identidad"}
          </button>
        </div>
      </form>

      {brief && (
        <div className="mt-6 space-y-5 border-t border-neutral-800 pt-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Paleta</h3>
            <div className="mt-2 flex flex-wrap gap-3">
              {brief.palette.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-lg border border-black/30" style={{ backgroundColor: c.hex }} />
                  <span className="text-sm text-neutral-300">
                    {c.name} <span className="font-mono text-neutral-500">{c.hex}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Tipografías</h3>
              <p className="mt-2 text-sm text-neutral-300">
                Títulos: <span className="font-medium">{brief.fonts.heading}</span>
                <br />
                Cuerpo: <span className="font-medium">{brief.fonts.body}</span>
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Tono</h3>
              <p className="mt-2 text-sm text-neutral-300">{brief.tone}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Eslogan</h3>
            <p className="mt-2 text-lg font-semibold text-neutral-100">“{brief.slogan}”</p>
          </div>

          {brief.copy.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Copys sugeridos</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
                {brief.copy.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
