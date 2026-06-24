import Link from "next/link";
import { isDbConfigured } from "@/lib/brands";
import { listOrgs } from "@/lib/crm";
import CampaignsClient from "@/components/crm/CampaignsClient";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          DATABASE_URL no está configurada.
        </div>
      </main>
    );
  }

  const orgs = await listOrgs();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
        <Link href="/" className="hover:text-neutral-200">
          ← Inicio
        </Link>
        <span className="text-neutral-700">/</span>
        <Link href="/crm/orgs" className="hover:text-neutral-200">
          Clientes
        </Link>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-300">Campañas</span>
      </div>

      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Campañas</h1>
        <p className="mt-1 text-sm text-neutral-400">Enviá emails a tus contactos y revisá el historial.</p>
      </header>

      {orgs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700 px-6 py-16 text-center text-neutral-400">
          <p className="text-lg">Primero creá un cliente con contactos.</p>
        </div>
      ) : (
        <CampaignsClient orgs={orgs} />
      )}
    </main>
  );
}
