import Link from "next/link";
import { isDbConfigured } from "@/lib/brands";
import { listOrgs } from "@/lib/crm";
import NewOrgForm from "@/components/crm/NewOrgForm";

export const dynamic = "force-dynamic";

export default async function OrgsPage() {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          DATABASE_URL no está configurada.
        </div>
      </main>
    );
  }

  const orgs = await listOrgs();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
        <Link href="/" className="hover:text-neutral-200">
          ← Inicio
        </Link>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-300">CRM · Clientes</span>
        <Link href="/crm/contacts" className="ml-auto hover:text-neutral-200">
          Contactos →
        </Link>
        <Link href="/crm/campaigns" className="hover:text-neutral-200">
          Campañas →
        </Link>
      </div>

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-neutral-400">{orgs.length} clientes registrados.</p>
        </div>
        <NewOrgForm />
      </header>

      {orgs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700 px-6 py-16 text-center text-neutral-400">
          <p className="text-lg">Todavía no hay clientes.</p>
          <p className="mt-1 text-sm">Creá el primero con “Nuevo cliente”.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((o) => (
            <li key={o.id}>
              <Link
                href={`/crm/orgs/${o.id}`}
                className="block h-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 transition hover:border-neutral-600 hover:bg-neutral-900"
              >
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold">{o.name}</h2>
                  {o.industry && (
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">
                      {o.industry}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex gap-4 text-sm text-neutral-400">
                  <span>{o.contact_count} contactos</span>
                  <span>{o.brand_count} marcas</span>
                </div>
                {o.brand_names.length > 0 && (
                  <p className="mt-2 truncate text-xs text-neutral-500">{o.brand_names.join(", ")}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
