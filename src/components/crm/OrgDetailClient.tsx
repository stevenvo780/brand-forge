"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STAGES = ["lead", "prospect", "client", "churned"] as const;
type Stage = (typeof STAGES)[number];
const STAGE_LABEL: Record<Stage, string> = {
  lead: "Lead",
  prospect: "Prospecto",
  client: "Cliente",
  churned: "Perdido",
};
const STAGE_COLOR: Record<Stage, string> = {
  lead: "bg-sky-900/60 text-sky-200",
  prospect: "bg-amber-900/60 text-amber-200",
  client: "bg-emerald-900/60 text-emerald-200",
  churned: "bg-neutral-800 text-neutral-400",
};

type Org = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  website: string | null;
  notes: string | null;
};
type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
};
type BrandRef = { id: string; slug: string; name: string };
type Pipeline = {
  id: string;
  stage: Stage;
  value: string;
  notes: string | null;
  contact_name: string | null;
};
type OrgAsset = { id: string; url: string; brand_name: string; created_at: string };

type Detail = {
  org: Org;
  contacts: Contact[];
  brands: BrandRef[];
  pipelines: Pipeline[];
  assets: OrgAsset[];
  unassignedBrands: BrandRef[];
};

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200";

export default function OrgDetailClient({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/orgs/${orgId}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || `Error ${res.status}`);
        return;
      }
      setDetail(body as Detail);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  async function mutate(url: string, method: string, body?: unknown) {
    setError(null);
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error || `Error ${res.status}`);
      return false;
    }
    await load();
    return true;
  }

  if (loading) return <p className="text-sm text-neutral-500">Cargando…</p>;
  if (!detail) return <p className="text-sm text-red-300">{error || "No se pudo cargar."}</p>;

  const { org, contacts, brands, pipelines, assets, unassignedBrands } = detail;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <OrgInfo
        org={org}
        onSave={(patch) => mutate(`/api/crm/orgs/${orgId}`, "PATCH", patch)}
        onDelete={async () => {
          if (!confirm("¿Eliminar este cliente y todos sus contactos/pipeline?")) return;
          const res = await fetch(`/api/crm/orgs/${orgId}`, { method: "DELETE" });
          if (res.ok) router.push("/crm/orgs");
        }}
      />

      {/* Pipeline */}
      <Card title="Pipeline">
        {pipelines.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin oportunidades.</p>
        ) : (
          <ul className="space-y-2">
            {pipelines.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2"
              >
                <select
                  value={p.stage}
                  onChange={(e) => mutate(`/api/crm/pipelines/${p.id}`, "PATCH", { stage: e.target.value })}
                  className={`rounded-full px-2 py-1 text-xs font-medium ${STAGE_COLOR[p.stage]}`}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABEL[s]}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-neutral-300">${Number(p.value).toLocaleString("es-CO")}</span>
                {p.contact_name && <span className="text-xs text-neutral-500">· {p.contact_name}</span>}
                {p.notes && <span className="text-xs text-neutral-500">· {p.notes}</span>}
                <button
                  onClick={() => mutate(`/api/crm/pipelines/${p.id}`, "DELETE")}
                  className="ml-auto text-xs text-neutral-500 hover:text-red-300"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
        <AddPipeline
          contacts={contacts}
          onAdd={(b) => mutate("/api/crm/pipelines", "POST", { org_id: orgId, ...b })}
        />
      </Card>

      {/* Contacts */}
      <Card title={`Contactos (${contacts.length})`}>
        {contacts.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin contactos.</p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    {c.name}
                    {c.role && <span className="text-neutral-500"> · {c.role}</span>}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <button
                  onClick={() => mutate(`/api/crm/contacts/${c.id}`, "DELETE")}
                  className="ml-auto text-xs text-neutral-500 hover:text-red-300"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
        <AddContact onAdd={(b) => mutate("/api/crm/contacts", "POST", { org_id: orgId, ...b })} />
      </Card>

      {/* Brands */}
      <Card title={`Marcas (${brands.length})`}>
        {brands.length === 0 ? (
          <p className="text-sm text-neutral-500">Ninguna marca asociada.</p>
        ) : (
          <ul className="divide-y divide-neutral-800">
            {brands.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2">
                <Link href={`/brands/${b.slug}`} className="text-sm text-neutral-200 hover:text-indigo-300">
                  {b.name} <span className="text-neutral-600">/{b.slug}</span>
                </Link>
                <button
                  onClick={() => mutate(`/api/crm/orgs/${orgId}`, "PATCH", { unassignBrandId: b.id })}
                  className="ml-auto text-xs text-neutral-500 hover:text-red-300"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
        {unassignedBrands.length > 0 && (
          <div className="mt-3 flex gap-2">
            <select id="assign-brand" className={inputCls} defaultValue="">
              <option value="" disabled>
                Asociar una marca…
              </option>
              {unassignedBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const el = document.getElementById("assign-brand") as HTMLSelectElement | null;
                if (el?.value) mutate(`/api/crm/orgs/${orgId}`, "PATCH", { assignBrandId: el.value });
              }}
              className="whitespace-nowrap rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
            >
              Asociar
            </button>
          </div>
        )}
      </Card>

      {/* Asset history */}
      <Card title={`Historial de assets (${assets.length})`}>
        {assets.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin assets generados por las marcas de este cliente.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {assets.map((a) => (
              <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.brand_name}
                  className="aspect-square w-full rounded-lg border border-neutral-800 object-cover transition group-hover:opacity-90"
                />
                <p className="mt-1 truncate text-[11px] text-neutral-500">{a.brand_name}</p>
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function OrgInfo({
  org,
  onSave,
  onDelete,
}: {
  org: Org;
  onSave: (patch: Record<string, string>) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(org.name);
  const [industry, setIndustry] = useState(org.industry ?? "");
  const [website, setWebsite] = useState(org.website ?? "");
  const [notes, setNotes] = useState(org.notes ?? "");

  if (!editing) {
    return (
      <Card
        title="Información"
        action={
          <div className="flex gap-3 text-xs">
            <button onClick={() => setEditing(true)} className="text-neutral-400 hover:text-neutral-200">
              Editar
            </button>
            <button onClick={onDelete} className="text-neutral-500 hover:text-red-300">
              Eliminar
            </button>
          </div>
        }
      >
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-neutral-500">Industria</dt>
            <dd className="text-neutral-200">{org.industry || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Sitio web</dt>
            <dd className="text-neutral-200">
              {org.website ? (
                <a href={org.website} target="_blank" rel="noreferrer" className="text-indigo-300 hover:underline">
                  {org.website}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-neutral-500">Notas</dt>
            <dd className="whitespace-pre-wrap text-neutral-200">{org.notes || "—"}</dd>
          </div>
        </dl>
      </Card>
    );
  }

  return (
    <Card title="Editar información">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
        <input className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industria" />
        <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Sitio web" />
        <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" />
      </div>
      <div className="mt-3 flex gap-3">
        <button
          onClick={async () => {
            if (await onSave({ name, industry, website, notes })) setEditing(false);
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Guardar
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
        >
          Cancelar
        </button>
      </div>
    </Card>
  );
}

function AddContact({ onAdd }: { onAdd: (b: Record<string, string>) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  return (
    <div className="mt-4 grid gap-2 border-t border-neutral-800 pt-4 sm:grid-cols-4">
      <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre *" />
      <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" />
      <div className="flex gap-2">
        <input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Rol" />
        <button
          onClick={async () => {
            if (!name.trim()) return;
            if (await onAdd({ name, email, phone, role })) {
              setName("");
              setEmail("");
              setPhone("");
              setRole("");
            }
          }}
          className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}

function AddPipeline({
  contacts,
  onAdd,
}: {
  contacts: Contact[];
  onAdd: (b: { stage: string; value: number; contact_id: string; notes: string }) => Promise<boolean>;
}) {
  const [stage, setStage] = useState<Stage>("lead");
  const [value, setValue] = useState("");
  const [contactId, setContactId] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div className="mt-4 grid gap-2 border-t border-neutral-800 pt-4 sm:grid-cols-5">
      <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABEL[s]}
          </option>
        ))}
      </select>
      <input
        className={inputCls}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Valor"
        inputMode="numeric"
      />
      <select className={inputCls} value={contactId} onChange={(e) => setContactId(e.target.value)}>
        <option value="">Sin contacto</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" />
      <button
        onClick={async () => {
          if (await onAdd({ stage, value: Number(value) || 0, contact_id: contactId, notes })) {
            setValue("");
            setNotes("");
            setContactId("");
            setStage("lead");
          }
        }}
        className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Añadir
      </button>
    </div>
  );
}
