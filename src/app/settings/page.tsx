import Link from "next/link";
import { isDbConfigured } from "@/lib/brands";
import ApiKeysManager from "@/components/ApiKeysManager";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
        <Link href="/" className="hover:text-neutral-200">
          ← Inicio
        </Link>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-300">Ajustes</span>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-neutral-400">API keys para la API pública (/api/v1).</p>
      </header>

      {!isDbConfigured() ? (
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          DATABASE_URL no está configurada.
        </div>
      ) : (
        <>
          <ApiKeysManager />
          <section className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Uso</h2>
            <p className="mt-3 text-sm text-neutral-400">
              Enviá el header <code className="font-mono text-neutral-300">X-Api-Key</code> en cada request:
            </p>
            <pre className="mt-3 overflow-auto rounded-lg bg-neutral-950 p-4 text-xs text-neutral-300">
{`curl -H "X-Api-Key: bf_..." \\
  https://brand-forge-633619052458.us-central1.run.app/api/v1/brands

curl -X POST -H "X-Api-Key: bf_..." -H "Content-Type: application/json" \\
  -d '{"template":"post-cuadrado"}' \\
  .../api/v1/brands/humanizar/generate-image`}
            </pre>
          </section>
        </>
      )}
    </main>
  );
}
