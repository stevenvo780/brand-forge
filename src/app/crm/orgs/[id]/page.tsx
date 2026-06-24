import Link from "next/link";
import { notFound } from "next/navigation";
import { isDbConfigured } from "@/lib/brands";
import { getOrg } from "@/lib/crm";
import OrgDetailClient from "@/components/crm/OrgDetailClient";

export const dynamic = "force-dynamic";

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isDbConfigured()) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          DATABASE_URL no está configurada.
        </div>
      </main>
    );
  }

  const org = await getOrg(id);
  if (!org) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-2 flex items-center gap-3 text-sm text-neutral-400">
        <Link href="/crm/orgs" className="hover:text-neutral-200">
          ← Clientes
        </Link>
      </div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">/{org.slug}</p>
      </header>

      <OrgDetailClient orgId={id} />
    </main>
  );
}
