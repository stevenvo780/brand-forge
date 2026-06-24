// Standalone reel worker. Polls the jobs table for queued reel jobs and
// processes them. Useful as a fallback or when running reel rendering as a
// dedicated process instead of in-request.
//
// Usage: DATABASE_URL=... GEMINI_API_KEY=... node --experimental-strip-types scripts/reel-worker.ts
import { claimNextReelJob } from "../src/lib/jobs";
import { processReelJob } from "../src/lib/reels";

const POLL_MS = Number(process.env.REEL_POLL_MS || 5000);

async function tick(): Promise<boolean> {
  const job = await claimNextReelJob();
  if (!job) return false;
  console.log(`[reel-worker] procesando job ${job.id} (brand ${job.brand_id})`);
  try {
    const url = await processReelJob(job);
    console.log(`[reel-worker] listo ${job.id} -> ${url}`);
  } catch (e) {
    console.error(`[reel-worker] falló ${job.id}:`, (e as Error).message);
  }
  return true;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL no está configurada.");
    process.exit(1);
  }
  console.log(`[reel-worker] iniciado, poll cada ${POLL_MS}ms`);
  // Drain continuously; sleep only when there's nothing to do.
  for (;;) {
    let worked = false;
    try {
      worked = await tick();
    } catch (e) {
      console.error("[reel-worker] error:", (e as Error).message);
    }
    if (!worked) await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
