import { query } from "../../db/client";

export type Org = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
};

export type OrgWithCounts = Org & {
  brand_count: number;
  contact_count: number;
  brand_names: string[];
};

export type Contact = {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
};

export type ContactWithOrg = Contact & { org_name: string; org_slug: string };

export const PIPELINE_STAGES = ["lead", "prospect", "client", "churned"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type Pipeline = {
  id: string;
  org_id: string;
  contact_id: string | null;
  stage: PipelineStage;
  value: string; // NUMERIC comes back as string from pg
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PipelineWithContact = Pipeline & { contact_name: string | null };

export type BrandRef = { id: string; slug: string; name: string };

export type OrgAsset = {
  id: string;
  url: string;
  kind: string;
  brand_name: string;
  created_at: string;
};

export type OrgDetail = {
  org: Org;
  contacts: Contact[];
  brands: BrandRef[];
  pipelines: PipelineWithContact[];
  assets: OrgAsset[];
};

export function isStage(s: string): s is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(s);
}

// --- Orgs -------------------------------------------------------------------

export async function listOrgs(): Promise<OrgWithCounts[]> {
  const { rows } = await query<OrgWithCounts>(
    `SELECT o.id, o.name, o.slug, o.industry, o.website, o.notes, o.created_at,
            COALESCE(b.cnt, 0)::int AS brand_count,
            COALESCE(c.cnt, 0)::int AS contact_count,
            COALESCE(b.names, '{}') AS brand_names
       FROM orgs o
       LEFT JOIN (
         SELECT org_id, COUNT(*) AS cnt, ARRAY_AGG(name ORDER BY name) AS names
           FROM brands WHERE org_id IS NOT NULL GROUP BY org_id
       ) b ON b.org_id = o.id
       LEFT JOIN (
         SELECT org_id, COUNT(*) AS cnt FROM contacts GROUP BY org_id
       ) c ON c.org_id = o.id
      ORDER BY o.created_at DESC`
  );
  return rows;
}

export async function getOrg(id: string): Promise<Org | null> {
  const { rows } = await query<Org>(
    `SELECT id, name, slug, industry, website, notes, created_at FROM orgs WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export type NewOrg = {
  name: string;
  slug: string;
  industry?: string | null;
  website?: string | null;
  notes?: string | null;
};

export async function createOrg(input: NewOrg): Promise<Org> {
  const { rows } = await query<Org>(
    `INSERT INTO orgs (name, slug, industry, website, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, slug, industry, website, notes, created_at`,
    [input.name, input.slug, input.industry ?? null, input.website ?? null, input.notes ?? null]
  );
  return rows[0];
}

export async function updateOrg(id: string, input: Partial<NewOrg>): Promise<Org | null> {
  const { rows } = await query<Org>(
    `UPDATE orgs SET
        name     = COALESCE($2, name),
        industry = COALESCE($3, industry),
        website  = COALESCE($4, website),
        notes    = COALESCE($5, notes)
      WHERE id = $1
      RETURNING id, name, slug, industry, website, notes, created_at`,
    [id, input.name ?? null, input.industry ?? null, input.website ?? null, input.notes ?? null]
  );
  return rows[0] ?? null;
}

export async function deleteOrg(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM orgs WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

export async function getOrgDetail(id: string): Promise<OrgDetail | null> {
  const org = await getOrg(id);
  if (!org) return null;

  const [{ rows: contacts }, { rows: brands }, { rows: pipelines }, { rows: assets }] =
    await Promise.all([
      query<Contact>(
        `SELECT id, org_id, name, email, phone, role, created_at
           FROM contacts WHERE org_id = $1 ORDER BY created_at DESC`,
        [id]
      ),
      query<BrandRef>(
        `SELECT id, slug, name FROM brands WHERE org_id = $1 ORDER BY name`,
        [id]
      ),
      query<PipelineWithContact>(
        `SELECT p.id, p.org_id, p.contact_id, p.stage, p.value, p.notes,
                p.created_at, p.updated_at, c.name AS contact_name
           FROM pipelines p
           LEFT JOIN contacts c ON c.id = p.contact_id
          WHERE p.org_id = $1
          ORDER BY p.updated_at DESC`,
        [id]
      ),
      query<OrgAsset>(
        `SELECT a.id, a.url, a.kind, b.name AS brand_name, a.created_at
           FROM assets a
           JOIN brands b ON b.id = a.brand_id
          WHERE b.org_id = $1
          ORDER BY a.created_at DESC
          LIMIT 24`,
        [id]
      ),
    ]);

  return { org, contacts, brands, pipelines, assets };
}

// --- Contacts ---------------------------------------------------------------

export async function listContacts(orgId?: string): Promise<ContactWithOrg[]> {
  const where = orgId ? "WHERE c.org_id = $1" : "";
  const params = orgId ? [orgId] : [];
  const { rows } = await query<ContactWithOrg>(
    `SELECT c.id, c.org_id, c.name, c.email, c.phone, c.role, c.created_at,
            o.name AS org_name, o.slug AS org_slug
       FROM contacts c
       JOIN orgs o ON o.id = c.org_id
       ${where}
      ORDER BY c.created_at DESC`,
    params
  );
  return rows;
}

export type NewContact = {
  org_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
};

export async function createContact(input: NewContact): Promise<Contact> {
  const { rows } = await query<Contact>(
    `INSERT INTO contacts (org_id, name, email, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, org_id, name, email, phone, role, created_at`,
    [input.org_id, input.name, input.email ?? null, input.phone ?? null, input.role ?? null]
  );
  return rows[0];
}

export async function getContact(id: string): Promise<Contact | null> {
  const { rows } = await query<Contact>(
    `SELECT id, org_id, name, email, phone, role, created_at FROM contacts WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateContact(
  id: string,
  input: Partial<Omit<NewContact, "org_id">>
): Promise<Contact | null> {
  const { rows } = await query<Contact>(
    `UPDATE contacts SET
        name  = COALESCE($2, name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        role  = COALESCE($5, role)
      WHERE id = $1
      RETURNING id, org_id, name, email, phone, role, created_at`,
    [id, input.name ?? null, input.email ?? null, input.phone ?? null, input.role ?? null]
  );
  return rows[0] ?? null;
}

export async function deleteContact(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM contacts WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

// --- Pipelines --------------------------------------------------------------

export type NewPipeline = {
  org_id: string;
  contact_id?: string | null;
  stage?: PipelineStage;
  value?: number;
  notes?: string | null;
};

export async function createPipeline(input: NewPipeline): Promise<Pipeline> {
  const { rows } = await query<Pipeline>(
    `INSERT INTO pipelines (org_id, contact_id, stage, value, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, org_id, contact_id, stage, value, notes, created_at, updated_at`,
    [input.org_id, input.contact_id ?? null, input.stage ?? "lead", input.value ?? 0, input.notes ?? null]
  );
  return rows[0];
}

export async function updatePipeline(
  id: string,
  input: { stage?: PipelineStage; value?: number; notes?: string | null; contact_id?: string | null }
): Promise<Pipeline | null> {
  const { rows } = await query<Pipeline>(
    `UPDATE pipelines SET
        stage      = COALESCE($2, stage),
        value      = COALESCE($3, value),
        notes      = COALESCE($4, notes),
        contact_id = COALESCE($5, contact_id),
        updated_at = now()
      WHERE id = $1
      RETURNING id, org_id, contact_id, stage, value, notes, created_at, updated_at`,
    [id, input.stage ?? null, input.value ?? null, input.notes ?? null, input.contact_id ?? null]
  );
  return rows[0] ?? null;
}

export async function deletePipeline(id: string): Promise<boolean> {
  const { rowCount } = await query(`DELETE FROM pipelines WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

// --- Brand <-> org link -----------------------------------------------------

export async function listUnassignedBrands(): Promise<BrandRef[]> {
  const { rows } = await query<BrandRef>(
    `SELECT id, slug, name FROM brands WHERE org_id IS NULL ORDER BY name`
  );
  return rows;
}

export async function assignBrandToOrg(brandId: string, orgId: string | null): Promise<boolean> {
  const { rowCount } = await query(`UPDATE brands SET org_id = $2 WHERE id = $1`, [brandId, orgId]);
  return (rowCount ?? 0) > 0;
}
