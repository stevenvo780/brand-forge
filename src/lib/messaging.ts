import { query } from "../../db/client";
import { getContact } from "./crm";

export const CHANNELS = ["email", "whatsapp"] as const;
export type Channel = (typeof CHANNELS)[number];
export type MessageStatus = "draft" | "queued" | "sent" | "failed";

export type Message = {
  id: string;
  org_id: string | null;
  contact_id: string | null;
  channel: Channel;
  subject: string | null;
  body: string;
  status: MessageStatus;
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

export type MessageWithContact = Message & {
  contact_name: string | null;
  contact_email: string | null;
};

export function isChannel(c: string): c is Channel {
  return (CHANNELS as readonly string[]).includes(c);
}

async function insertMessage(input: {
  org_id: string | null;
  contact_id: string | null;
  channel: Channel;
  subject: string | null;
  body: string;
  status: MessageStatus;
  error: string | null;
  sent_at: string | null;
}): Promise<Message> {
  const { rows } = await query<Message>(
    `INSERT INTO messages (org_id, contact_id, channel, subject, body, status, error, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, org_id, contact_id, channel, subject, body, status, error, sent_at, created_at`,
    [
      input.org_id,
      input.contact_id,
      input.channel,
      input.subject,
      input.body,
      input.status,
      input.error,
      input.sent_at,
    ]
  );
  return rows[0];
}

/** Send via Resend REST API. Returns null on success, or an error message. */
async function sendViaResend(to: string, subject: string, body: string): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return "no-provider";
  const from = process.env.RESEND_FROM || "Brand Forge <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        // Minimal HTML wrapper preserving line breaks.
        html: `<div style="font-family:sans-serif;white-space:pre-wrap">${body
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")}</div>`,
        text: body,
      }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      return (b as { message?: string }).message || `Resend respondió ${res.status}`;
    }
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

export type SendResult = { message: Message; note: string };

/**
 * Create + attempt to send a message.
 *  - email  : sends via Resend if RESEND_API_KEY is set, else stored as draft.
 *  - whatsapp: stored as queued (real send wired later with credentials).
 */
export async function sendMessage(input: {
  contactId: string;
  channel: Channel;
  subject?: string;
  body: string;
}): Promise<SendResult> {
  const contact = await getContact(input.contactId);
  if (!contact) {
    throw new Error("Contacto no encontrado");
  }

  const subject = (input.subject || "").trim() || null;
  const base = {
    org_id: contact.org_id,
    contact_id: contact.id,
    channel: input.channel,
    subject,
    body: input.body,
  };

  if (input.channel === "whatsapp") {
    const message = await insertMessage({
      ...base,
      status: "queued",
      error: null,
      sent_at: null,
    });
    return { message, note: "WhatsApp aún no está activo: mensaje encolado como pendiente." };
  }

  // email
  if (!contact.email) {
    const message = await insertMessage({ ...base, status: "draft", error: "Contacto sin email", sent_at: null });
    return { message, note: "El contacto no tiene email: guardado como borrador." };
  }

  const err = await sendViaResend(contact.email, subject || "(sin asunto)", input.body);
  if (err === null) {
    const message = await insertMessage({
      ...base,
      status: "sent",
      error: null,
      sent_at: new Date().toISOString(),
    });
    return { message, note: `Email enviado a ${contact.email}.` };
  }
  if (err === "no-provider") {
    const message = await insertMessage({ ...base, status: "draft", error: null, sent_at: null });
    return { message, note: "RESEND_API_KEY no configurada: guardado como borrador." };
  }
  const message = await insertMessage({ ...base, status: "failed", error: err, sent_at: null });
  return { message, note: `Fallo al enviar: ${err}` };
}

export async function listMessages(filter: {
  orgId?: string;
  contactId?: string;
}): Promise<MessageWithContact[]> {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filter.orgId) {
    params.push(filter.orgId);
    conds.push(`m.org_id = $${params.length}`);
  }
  if (filter.contactId) {
    params.push(filter.contactId);
    conds.push(`m.contact_id = $${params.length}`);
  }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const { rows } = await query<MessageWithContact>(
    `SELECT m.id, m.org_id, m.contact_id, m.channel, m.subject, m.body, m.status,
            m.error, m.sent_at, m.created_at,
            c.name AS contact_name, c.email AS contact_email
       FROM messages m
       LEFT JOIN contacts c ON c.id = m.contact_id
       ${where}
      ORDER BY m.created_at DESC
      LIMIT 100`,
    params
  );
  return rows;
}
