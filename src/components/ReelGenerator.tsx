"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Job = {
  id: string;
  status: "queued" | "processing" | "done" | "failed";
  params: { duration?: number; style?: string; text?: string };
  result: { url?: string; error?: string };
  created_at: string;
};

const STYLES = [
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
  { id: "pulse", label: "Pulse" },
];

const STATUS_LABEL: Record<Job["status"], string> = {
  queued: "En cola",
  processing: "Procesando…",
  done: "Listo",
  failed: "Error",
};
const STATUS_COLOR: Record<Job["status"], string> = {
  queued: "bg-sky-900/60 text-sky-200",
  processing: "bg-amber-900/60 text-amber-200",
  done: "bg-emerald-900/60 text-emerald-200",
  failed: "bg-red-900/60 text-red-200",
};

const inputCls =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200";

export default function ReelGenerator({ slug }: { slug: string }) {
  const [duration, setDuration] = useState(5);
  const [style, setStyle] = useState("fade");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${slug}/reels`, { cache: "no-store" });
      if (res.ok) {
        const b = await res.json();
        setJobs(b.jobs ?? []);
      }
    } catch {
      /* non-fatal */
    }
  }, [slug]);

  useEffect(() => {
    loadJobs();
    // Poll while any job is still in progress.
    timer.current = setInterval(loadJobs, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [loadJobs]);

  const anyActive = jobs.some((j) => j.status === "queued" || j.status === "processing");
  useEffect(() => {
    // Stop polling once everything settled; restart handled by loadJobs effect.
    if (!anyActive && timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    } else if (anyActive && !timer.current) {
      timer.current = setInterval(loadJobs, 5000);
    }
  }, [anyActive, loadJobs]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/brands/${slug}/generate-reel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, style, text }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(b.error || `Error ${res.status}`);
        return;
      }
      await loadJobs();
      if (!timer.current) timer.current = setInterval(loadJobs, 5000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Reels</h2>
      <p className="mt-1 text-xs text-neutral-500">Video vertical 1080×1920 generado de forma asíncrona.</p>

      <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-neutral-400">Duración (s)</label>
          <input
            type="number"
            min={2}
            max={15}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={`mt-1 ${inputCls}`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400">Estilo</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)} className={`mt-1 ${inputCls}`}>
            {STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-neutral-400">Texto principal</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Texto del reel"
            className={`mt-1 ${inputCls}`}
          />
        </div>
        <div className="sm:col-span-4">
          {error && (
            <div className="mb-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Encolando…" : "Generar reel"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Generados</h3>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Aún no hay reels.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-2">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_COLOR[j.status]}`}>
                    {STATUS_LABEL[j.status]}
                  </span>
                  <span className="text-neutral-500">{j.params?.style}</span>
                </div>
                {j.status === "done" && j.result?.url ? (
                  <video
                    src={j.result.url}
                    controls
                    playsInline
                    className="mt-2 aspect-[9/16] w-full rounded bg-black object-cover"
                  />
                ) : j.status === "failed" ? (
                  <p className="mt-2 text-xs text-red-300">{j.result?.error || "Falló la generación"}</p>
                ) : (
                  <div className="mt-2 flex aspect-[9/16] w-full items-center justify-center rounded bg-neutral-900 text-xs text-neutral-500">
                    {STATUS_LABEL[j.status]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
