import { query } from "../../db/client";
import { getBrandBySlug } from "./brands";
import { TEMPLATES, isKnownTemplate, type TemplateFields } from "./templates";
import { renderImage } from "./render";
import { uploadAsset } from "./storage";

export type Asset = {
  id: string;
  brand_id: string;
  job_id: string | null;
  kind: string;
  url: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export async function generateBrandImage(
  slug: string,
  template: string,
  fields: TemplateFields
): Promise<Asset> {
  if (!isKnownTemplate(template)) {
    throw new Error(`Plantilla desconocida: ${template}`);
  }

  const brand = await getBrandBySlug(slug);
  if (!brand) {
    throw new Error(`Marca no encontrada: ${slug}`);
  }

  const builder = TEMPLATES[template];
  const { html, width, height } = builder(brand, fields);

  const png = await renderImage(html, width, height);

  const timestamp = Date.now();
  const key = `brands/${slug}/${template}-${timestamp}.png`;
  const url = await uploadAsset(png, key, "image/png");

  const meta = { template, fields, width, height };
  const { rows } = await query<Asset>(
    `INSERT INTO assets (brand_id, kind, url, meta)
     VALUES ($1, 'image', $2, $3::jsonb)
     RETURNING id, brand_id, job_id, kind, url, meta, created_at`,
    [brand.id, url, JSON.stringify(meta)]
  );
  return rows[0];
}

export async function listBrandAssets(slug: string): Promise<Asset[]> {
  const { rows } = await query<Asset>(
    `SELECT a.id, a.brand_id, a.job_id, a.kind, a.url, a.meta, a.created_at
       FROM assets a
       JOIN brands b ON b.id = a.brand_id
      WHERE b.slug = $1 AND a.kind = 'image'
      ORDER BY a.created_at DESC`,
    [slug]
  );
  return rows;
}
