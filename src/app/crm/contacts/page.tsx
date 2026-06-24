import Link from "next/link";
import { isDbConfigured } from "@/lib/brands";
import { listContacts, listOrgs } from "@/lib/crm";
import ContactsFilter from "@/components/crm/ContactsFilter";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  if (!isDbConfigured()) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          DATABASE_URL no está configurada.
        </div>
      </main>
    );
  }

  const { org } = await searchParams;
  const [contacts, orgs] = await Promise.all([listContacts(org), listOrgs()]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
        <Link href="/" className="hover:text-neutral-200">
          ← Inicio
        </Link>
        <span className="text-neutral-700">/</span>
        <Link href="/crm/orgs" className="hover:text-neutral-200">
          Clientes
        </Link>
        <span className="text-neutral-700">/</span>
        <span className="text-neutral-300">Contactos</span>
      </div>

      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contactos</h1>
          <p className="mt-1 text-sm text-neutral-400">{contacts.length} contactos.</p>
        </div>
        <ContactsFilter orgs={orgs} current={org ?? ""} />
      </header>

      {contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700 px-6 py-16 text-center text-neutral-400">
          <p className="text-lg">No hay contactos.</p>
          <p className="mt-1 text-sm">Añadí contactos desde la ficha de un cliente.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/80 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Cliente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-900/50">
                  <td className="px-4 py-3 font-medium text-neutral-200">{c.name}</td>
                  <td className="px-4 py-3 text-neutral-400">{c.role || "—"}</td>
                  <td className="px-4 py-3 text-neutral-400">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-neutral-400">{c.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/crm/orgs/${c.org_id}`} className="text-indigo-300 hover:underline">
                      {c.org_name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
