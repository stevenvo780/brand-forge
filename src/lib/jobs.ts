import { query } from "../../db/client";

export type JobType = "image" | "reel";
export type JobStatus = "queued" | "processing" | "done" | "failed";

export type Job = {
  id: string;
  brand_id: string;
  type: JobType;
  status: JobStatus;
  params: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
};

export async function createJob(
  brandId: string,
  type: JobType,
  params: Record<string, unknown>
): Promise<Job> {
  const { rows } = await query<Job>(
    `INSERT INTO jobs (brand_id, type, status, params)
     VALUES ($1, $2, 'queued', $3::jsonb)
     RETURNING id, brand_id, type, status, params, result, created_at`,
    [brandId, type, JSON.stringify(params)]
  );
  return rows[0];
}

export async function getJob(id: string): Promise<Job | null> {
  const { rows } = await query<Job>(
    `SELECT id, brand_id, type, status, params, result, created_at FROM jobs WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function setJobStatus(
  id: string,
  status: JobStatus,
  result?: Record<string, unknown>
): Promise<void> {
  if (result) {
    await query(`UPDATE jobs SET status = $2, result = result || $3::jsonb WHERE id = $1`, [
      id,
      status,
      JSON.stringify(result),
    ]);
  } else {
    await query(`UPDATE jobs SET status = $2 WHERE id = $1`, [id, status]);
  }
}

/**
 * Atomically claim a queued job (for the polling worker): flips the first
 * queued reel job to 'processing' and returns it, or null if none.
 */
export async function claimNextReelJob(): Promise<Job | null> {
  const { rows } = await query<Job>(
    `UPDATE jobs SET status = 'processing'
      WHERE id = (
        SELECT id FROM jobs
         WHERE type = 'reel' AND status = 'queued'
         ORDER BY created_at
         FOR UPDATE SKIP LOCKED
         LIMIT 1
      )
      RETURNING id, brand_id, type, status, params, result, created_at`
  );
  return rows[0] ?? null;
}

export async function listBrandJobs(slug: string, type: JobType): Promise<Job[]> {
  const { rows } = await query<Job>(
    `SELECT j.id, j.brand_id, j.type, j.status, j.params, j.result, j.created_at
       FROM jobs j
       JOIN brands b ON b.id = j.brand_id
      WHERE b.slug = $1 AND j.type = $2
      ORDER BY j.created_at DESC
      LIMIT 50`,
    [slug, type]
  );
  return rows;
}
