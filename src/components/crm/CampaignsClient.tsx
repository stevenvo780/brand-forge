"use client";

import { useCallback, useEffect, useState } from "react";

type Org = { id: string; name: string };
type Contact = { id: string; name: string; email: string | null };
type Message = {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  contact_name: string | null;
  contact_email: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  sent: "bg-emerald-900/60 text-emerald-200",
  queued: "bg-sky-900/60 text-sky-200",
  draft: "bg-neutral-800 text-neutral-300",
  failed: "bg-red-900/60 text-red-200",
};

const inputCls =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200";

export default function CampaignsClient({ orgs }: { orgs: Org[] }) {
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState("");
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadContacts = useCallback(async () => {
    if (!orgId) return;
    const res = await fetch(`/api/crm/contacts?org=${orgId}`, { cache: "no-store" });
    const b = await res.json().catch(() => ({}));
    const list: Contact[] = b.contacts ?? [];
    setContacts(list);
    setContactId((prev) => (list.some((c) => c.id === prev) ? prev : list[0]?.id ?? ""));
  }, [orgId]);

  const loadMessages = useCallback(async () => {
    const url = orgId ? `/api/messages?org=${orgId}` : "/api/messages";
    const res = await fetch(url, { cache: "no-store" });
    const b = await res.json().catch(() => ({}));
    setMessages(b.messages ?? []);
  }, [orgId]);

  useEffect(() => {
    loadContacts();
    loadMessages();
  }, [loadContacts, loadMessages]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, channel, subject, body }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(b.error || `Error ${res.status}`);
        return;
      }
      setNote(b.note || "Mensaje procesado.");
      setSubject("");
      setBody("");
      await loadMessages();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form onSubmit={onSend} className="lg:col-span-2 space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Nuevo mensaje</h2>

        <div>
          <label className="block text-xs font-medium text-neutral-400">Cliente</label>
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className={`mt-1 ${inputCls}`}>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400">Contacto</label>
          <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={`mt-1 ${inputCls}`}>
            {contacts.length === 0 && <option value="">Sin contactos</option>}
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.email ? `· ${c.email}` : "(sin email)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400">Canal</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={`mt-1 ${inputCls}`}>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp (pendiente)</option>
          </select>
        </div>

        {channel === "email" && (
          <div>
            <label className="block text-xs font-medium text-neutral-400">Asunto</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-neutral-400">Mensaje</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className={`mt-1 ${inputCls}`}
            placeholder="Escribí el cuerpo del mensaje…"
          />
        </div>

        {note && (
          <div className="rounded-lg border border-sky-800/60 bg-sky-950/40 px-3 py-2 text-sm text-sky-200">{note}</div>
        )}
        {error && (
          <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
        )}

        <button
          type="submit"
          disabled={sending || !contactId || !body.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {sending ? "Enviando…" : channel === "email" ? "Enviar email" : "Encolar WhatsApp"}
        </button>
      </form>

      <div className="lg:col-span-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Historial ({messages.length})
        </h2>
        {messages.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Sin mensajes todavía.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLOR[m.status] ?? "bg-neutral-800"}`}>
                    {m.status}
                  </span>
                  <span className="text-neutral-500">{m.channel}</span>
                  <span className="text-neutral-500">· {m.contact_name || "—"}</span>
                  <span className="ml-auto text-neutral-600">{new Date(m.created_at).toLocaleString("es-CO")}</span>
                </div>
                {m.subject && <p className="mt-2 text-sm font-medium text-neutral-200">{m.subject}</p>}
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-400">{m.body}</p>
                {m.error && <p className="mt-1 text-xs text-red-300">Error: {m.error}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
