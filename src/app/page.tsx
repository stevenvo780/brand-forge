import Link from "next/link";
import { listBrands, isDbConfigured, type Brand } from "@/lib/brands";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

async function loadBrands(): Promise<{ brands: Brand[]; error: string | null }> {
  if (!isDbConfigured()) {
    return { brands: [], error: "DATABASE_URL no está configurada — la base de datos está deshabilitada." };
  }
  try {
    return { brands: await listBrands(), error: null };
  } catch (e) {
    return { brands: [], error: `No se pudo consultar la base de datos: ${(e as Error).message}` };
  }
}

export default async function HomePage() {
  const { brands, error } = await loadBrands();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Forge</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Marcas y sus assets generados.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/brands/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Nueva marca
          </Link>
          <LogoutButton />
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      {brands.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-neutral-700 px-6 py-16 text-center text-neutral-400">
          <p className="text-lg">Todavía no hay marcas.</p>
          <p className="mt-1 text-sm">Creá la primera con “Nueva marca”.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => {
            const colors = (b.data?.colors ?? {}) as Record<string, string>;
            const swatches = Object.values(colors).filter(Boolean).slice(0, 5);
            return (
              <li key={b.id}>
                <Link
                  href={`/brands/${b.slug}`}
                  className="block rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:border-neutral-600 hover:bg-neutral-900"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{b.name}</h2>
                    <span className="text-xs text-neutral-500">/{b.slug}</span>
                  </div>
                  {swatches.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {swatches.map((c, i) => (
                        <span
                          key={i}
                          className="h-6 w-6 rounded-full border border-black/30"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
