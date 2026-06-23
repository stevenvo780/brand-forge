"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewBrandPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [primary, setPrimary] = useState("#4f46e5");
  const [secondary, setSecondary] = useState("#22d3ee");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [texts, setTexts] = useState('{\n  "tagline": "",\n  "about": ""\n}');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let parsedTexts: Record<string, unknown> = {};
    if (texts.trim()) {
      try {
        parsedTexts = JSON.parse(texts);
      } catch {
        setError("El campo de textos no es JSON válido.");
        return;
      }
    }

    const data = {
      colors: { primary, secondary },
      typography: { fontFamily },
      texts: parsedTexts,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: effectiveSlug, data }),
      });
      if (res.ok) {
        const body = await res.json();
        router.push(`/brands/${body.brand.slug}`);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "No se pudo crear la marca.");
      }
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-indigo-500";

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Volver
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Nueva marca</h1>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-300">
            Nombre
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              required
            />
          </label>
          <label className="block text-sm font-medium text-neutral-300">
            Slug
            <input
              type="text"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className={inputCls}
              required
            />
          </label>
        </div>

        <fieldset className="rounded-xl border border-neutral-800 p-4">
          <legend className="px-2 text-sm font-medium text-neutral-300">Colores</legend>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm text-neutral-400">
              Primario
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-12 rounded border border-neutral-700 bg-neutral-950" />
                <input type="text" value={primary} onChange={(e) => setPrimary(e.target.value)} className={inputCls} />
              </div>
            </label>
            <label className="block text-sm text-neutral-400">
              Secundario
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="h-9 w-12 rounded border border-neutral-700 bg-neutral-950" />
                <input type="text" value={secondary} onChange={(e) => setSecondary(e.target.value)} className={inputCls} />
              </div>
            </label>
          </div>
        </fieldset>

        <label className="block text-sm font-medium text-neutral-300">
          Tipografía
          <input
            type="text"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            placeholder="Inter, Roboto, …"
            className={inputCls}
          />
        </label>

        <label className="block text-sm font-medium text-neutral-300">
          Textos (JSON)
          <textarea
            value={texts}
            onChange={(e) => setTexts(e.target.value)}
            rows={8}
            className={`${inputCls} font-mono text-xs`}
            spellCheck={false}
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar marca"}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-neutral-700 px-5 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
