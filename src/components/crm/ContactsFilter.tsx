"use client";

import { useRouter } from "next/navigation";

type OrgOption = { id: string; name: string };

export default function ContactsFilter({ orgs, current }: { orgs: OrgOption[]; current: string }) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={(e) => {
        const v = e.target.value;
        router.push(v ? `/crm/contacts?org=${v}` : "/crm/contacts");
      }}
      className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
    >
      <option value="">Todos los clientes</option>
      {orgs.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}
