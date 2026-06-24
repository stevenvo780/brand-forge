import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Brand } from "./brands";
import { getBrowser } from "./render";
import { uploadAsset } from "./storage";
import { query } from "../../db/client";
import { setJobStatus, type Job } from "./jobs";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 15;
export const REEL_STYLES = ["fade", "slide", "pulse"] as const;
export type ReelStyle = (typeof REEL_STYLES)[number];

export type ReelParams = { duration: number; style: ReelStyle; text: string };

function readBrand(brand: Brand) {
  const data = (brand.data ?? {}) as Record<string, unknown>;
  const colors = (data.colors ?? {}) as Record<string, string>;
  const primary = colors.primary || (data.colorPrimario as string) || "#4f46e5";
  const secondary = colors.secondary || (data.colorSecundario as string) || "#22d3ee";
  const slogan = (data.slogan as string) || brand.name;
  return { primary, secondary, slogan };
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * A self-contained reel scene. `window.__setProgress(p)` (p in 0..1) drives the
 * animation so we can render deterministic frames via Playwright.
 */
export function buildReelHtml(brand: Brand, params: ReelParams): string {
  const { primary, secondary, slogan } = readBrand(brand);
  const text = params.text || brand.name;
  const style: ReelStyle = REEL_STYLES.includes(params.style) ? params.style : "fade";

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; }
  body {
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:#0b0c10; color:#fff;
    display:flex; align-items:center; justify-content:center; position:relative;
  }
  #bg { position:absolute; inset:-20%;
        background:linear-gradient(135deg, ${esc(primary)}, ${esc(secondary)});
        will-change:transform; }
  .center { position:relative; z-index:2; text-align:center; padding:0 120px; }
  #title { font-size:130px; font-weight:800; line-height:1.05; letter-spacing:-0.02em;
           will-change:transform,opacity; }
  #brand { margin-top:60px; font-size:46px; font-weight:700; letter-spacing:0.06em;
           text-transform:uppercase; opacity:0.9; will-change:opacity; }
  .dot { display:inline-block; width:26px; height:26px; border-radius:50%; background:#fff;
         margin-right:18px; vertical-align:middle; }
  #vign { position:absolute; inset:0; z-index:1;
          background:radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%); }
</style></head>
<body>
  <div id="bg"></div>
  <div id="vign"></div>
  <div class="center">
    <div id="title">${esc(text)}</div>
    <div id="brand"><span class="dot"></span>${esc(slogan)}</div>
  </div>
<script>
  var STYLE = ${JSON.stringify(style)};
  function ease(t){ return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
  window.__setProgress = function(p){
    var bg = document.getElementById('bg');
    var title = document.getElementById('title');
    var brand = document.getElementById('brand');
    // Background always drifts/rotates slightly for life.
    bg.style.transform = 'rotate(' + (p*8 - 4) + 'deg) scale(' + (1.1 + p*0.15) + ')';
    var e = ease(Math.min(1, p*1.4));
    if (STYLE === 'slide') {
      title.style.transform = 'translateY(' + ((1-e)*120) + 'px)';
      title.style.opacity = String(e);
    } else if (STYLE === 'pulse') {
      var s = 0.85 + e*0.15 + Math.sin(p*Math.PI*4)*0.03;
      title.style.transform = 'scale(' + s + ')';
      title.style.opacity = String(e);
    } else { // fade
      title.style.opacity = String(e);
      title.style.transform = 'translateY(' + ((1-e)*30) + 'px)';
    }
    brand.style.opacity = String(Math.max(0, (p-0.35)/0.4));
  };
  window.__setProgress(0);
</script>
</body></html>`;
}

type Page = Awaited<ReturnType<Awaited<ReturnType<typeof getBrowser>>["newPage"]>>;

async function renderFrames(html: string, frameCount: number, dir: string): Promise<void> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  try {
    const page: Page = await context.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    for (let i = 0; i < frameCount; i++) {
      const p = frameCount <= 1 ? 1 : i / (frameCount - 1);
      await page.evaluate((prog) => {
        (window as unknown as { __setProgress: (n: number) => void }).__setProgress(prog);
      }, p);
      const buf = await page.screenshot({ type: "png" });
      const name = `frame-${String(i).padStart(4, "0")}.png`;
      await writeFile(join(dir, name), buf);
    }
  } finally {
    await context.close();
  }
}

function encodeMp4(dir: string, fps: number, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-framerate", String(fps),
      "-i", join(dir, "frame-%04d.png"),
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-vf", "scale=1080:1920:flags=lanczos",
      outPath,
    ];
    const ff = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    ff.stderr.on("data", (d) => (stderr += d.toString()));
    ff.on("error", (e) => reject(new Error(`ffmpeg no disponible: ${e.message}`)));
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg falló (${code}): ${stderr.slice(-500)}`));
    });
  });
}

/** Full pipeline for a queued reel job: render → encode → upload → record asset. */
export async function processReelJob(job: Job): Promise<string> {
  // Mark processing up-front and wrap the WHOLE pipeline so ANY failure
  // (brand lookup, mkdtemp, render, encode, upload) records 'failed' — a job
  // can never get silently stranded in 'queued'/'processing'.
  let dir: string | null = null;
  try {
    await setJobStatus(job.id, "processing");

    const params = job.params as unknown as ReelParams;
    const duration = Math.min(15, Math.max(2, Number(params.duration) || 5));
    const frameCount = Math.round(duration * FPS);

    const { rows: brandRows } = await query<Brand>(
      `SELECT id, slug, name, data, created_at FROM brands WHERE id = $1`,
      [job.brand_id]
    );
    const brand = brandRows[0];
    if (!brand) throw new Error("Marca no encontrada para el job");

    const html = buildReelHtml(brand, {
      duration,
      style: params.style,
      text: params.text || brand.name,
    });

    dir = await mkdtemp(join(tmpdir(), "reel-"));
    const outPath = join(dir, "reel.mp4");

    await renderFrames(html, frameCount, dir);
    await encodeMp4(dir, FPS, outPath);

    const { readFile } = await import("node:fs/promises");
    const mp4 = await readFile(outPath);
    const key = `brands/${brand.slug}/reel-${Date.now()}.mp4`;
    const url = await uploadAsset(mp4, key, "video/mp4");

    await query(
      `INSERT INTO assets (brand_id, job_id, kind, url, meta)
       VALUES ($1, $2, 'reel', $3, $4::jsonb)`,
      [brand.id, job.id, url, JSON.stringify({ duration, style: params.style, frames: frameCount })]
    );
    await setJobStatus(job.id, "done", { url, duration, frames: frameCount });
    return url;
  } catch (e) {
    await setJobStatus(job.id, "failed", { error: (e as Error).message }).catch(() => {});
    throw e;
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true });
  }
}

export function isReelStyle(s: string): s is ReelStyle {
  return (REEL_STYLES as readonly string[]).includes(s);
}
