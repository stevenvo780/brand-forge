import { isDbConfigured, query } from "../../db/client";

export type Brand = {
  id: string;
  slug: string;
  name: string;
  data: Record<string, unknown>;
  created_at: string;
};

export type NewBrandInput = {
  slug: string;
  name: string;
  data: Record<string, unknown>;
};

export async function listBrands(): Promise<Brand[]> {
  const { rows } = await query<Brand>(
    "SELECT id, slug, name, data, created_at FROM brands ORDER BY created_at DESC"
  );
  return rows;
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const { rows } = await query<Brand>(
    "SELECT id, slug, name, data, created_at FROM brands WHERE slug = $1",
    [slug]
  );
  return rows[0] ?? null;
}

export async function createBrand(input: NewBrandInput): Promise<Brand> {
  const { rows } = await query<Brand>(
    `INSERT INTO brands (slug, name, data)
     VALUES ($1, $2, $3::jsonb)
     RETURNING id, slug, name, data, created_at`,
    [input.slug, input.name, JSON.stringify(input.data)]
  );
  return rows[0];
}

/**
 * Shallow-merge a patch into brands.data (JSONB `||`). Top-level keys in
 * `patch` overwrite existing ones; other keys are preserved. Returns the
 * updated brand, or null if the slug does not exist.
 */
export async function mergeBrandData(
  slug: string,
  patch: Record<string, unknown>
): Promise<Brand | null> {
  const { rows } = await query<Brand>(
    `UPDATE brands
        SET data = data || $2::jsonb
      WHERE slug = $1
      RETURNING id, slug, name, data, created_at`,
    [slug, JSON.stringify(patch)]
  );
  return rows[0] ?? null;
}

export { isDbConfigured };
