import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandBySlug, isDbConfigured } from "@/lib/brands";
import ImageGenerator from "@/components/ImageGenerator";
import BrandBrief from "@/components/BrandBrief";
import { TEMPLATE_LIST } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isDbConfigured()) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </Link>
        <div className="mt-6 rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          DATABASE_URL no está configurada — no se puede cargar la marca.
        </div>
      </main>
    );
  }

  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const colors = (brand.data?.colors ?? {}) as Record<string, string>;
  const typography = (brand.data?.typography ?? {}) as Record<string, string>;
  const texts = (brand.data?.texts ?? {}) as Record<string, unknown>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Volver
      </Link>

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">/{brand.slug}</p>
      </header>

      <section className="mt-8 space-y-6">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Colores</h2>
          <div className="mt-3 flex flex-wrap gap-4">
            {Object.entries(colors).length === 0 && (
              <span className="text-sm text-neutral-500">Sin colores definidos.</span>
            )}
            {Object.entries(colors).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full border border-black/30" style={{ backgroundColor: v }} />
                <span className="text-sm text-neutral-300">
                  {k}: <span className="font-mono text-neutral-400">{v}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Tipografía</h2>
          <p className="mt-3 text-sm text-neutral-300">
            {typography.fontFamily || "—"}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Textos</h2>
          <pre className="mt-3 overflow-auto rounded-lg bg-neutral-950 p-4 text-xs text-neutral-300">
            {JSON.stringify(texts, null, 2)}
          </pre>
        </div>

        <BrandBrief
          slug={brand.slug}
          initialBrief={
            (brand.data?.brief as React.ComponentProps<typeof BrandBrief>["initialBrief"]) ?? null
          }
        />

        <ImageGenerator slug={brand.slug} templates={TEMPLATE_LIST} />

        <details className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Data completa (JSON)
          </summary>
          <pre className="mt-3 overflow-auto rounded-lg bg-neutral-950 p-4 text-xs text-neutral-300">
            {JSON.stringify(brand.data, null, 2)}
          </pre>
        </details>
      </section>
    </main>
  );
}
