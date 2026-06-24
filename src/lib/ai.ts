// Gemini Flash "brand brain". Calls the Generative Language REST API directly
// (no SDK dependency) and coerces the model's reply into a strict BrandBrief.
//
// Env:
//   GEMINI_API_KEY   required to call the model
//   GEMINI_MODEL     optional, defaults to gemini-1.5-flash

export type PaletteColor = { name: string; hex: string };

export type BrandBrief = {
  palette: PaletteColor[];
  fonts: { heading: string; body: string };
  slogan: string;
  tone: string;
  copy: string[];
};

export type BriefParams = {
  brandName: string;
  industry: string;
  keywords: string;
  targetAudience: string;
};

// gemini-1.5-flash was retired from the public API; 2.5-flash is the current
// stable Flash tier. Overridable via GEMINI_MODEL.
const DEFAULT_MODEL = "gemini-2.5-flash";

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function normalizeHex(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  let h = raw.trim();
  if (!h.startsWith("#")) h = `#${h}`;
  // Expand #abc -> #aabbcc.
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return HEX_RE.test(h) ? h.toLowerCase() : fallback;
}

const FALLBACK_HEXES = ["#4f46e5", "#22d3ee", "#0f172a", "#f59e0b", "#10b981"];

/** Coerce arbitrary parsed JSON into a valid BrandBrief, filling gaps. */
function coerceBrief(raw: unknown, params: BriefParams): BrandBrief {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const rawPalette = Array.isArray(obj.palette) ? obj.palette : [];
  const palette: PaletteColor[] = rawPalette
    .slice(0, 6)
    .map((c, i) => {
      const co = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
      return {
        name: typeof co.name === "string" && co.name.trim() ? co.name.trim() : `Color ${i + 1}`,
        hex: normalizeHex(co.hex, FALLBACK_HEXES[i % FALLBACK_HEXES.length]),
      };
    })
    .filter((c) => c.hex);

  while (palette.length < 3) {
    const i = palette.length;
    palette.push({ name: `Color ${i + 1}`, hex: FALLBACK_HEXES[i] });
  }

  const fontsObj = (obj.fonts && typeof obj.fonts === "object" ? obj.fonts : {}) as Record<string, unknown>;
  const heading = typeof fontsObj.heading === "string" && fontsObj.heading.trim() ? fontsObj.heading.trim() : "Poppins";
  const body = typeof fontsObj.body === "string" && fontsObj.body.trim() ? fontsObj.body.trim() : "Inter";

  const slogan =
    typeof obj.slogan === "string" && obj.slogan.trim() ? obj.slogan.trim() : params.brandName;
  const tone = typeof obj.tone === "string" && obj.tone.trim() ? obj.tone.trim() : "Profesional y cercano";

  const rawCopy = Array.isArray(obj.copy) ? obj.copy : [];
  const copy = rawCopy
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    .map((c) => c.trim())
    .slice(0, 5);

  return { palette, fonts: { heading, body }, slogan, tone, copy };
}

function buildPrompt(params: BriefParams): string {
  return [
    "Eres un director creativo y estratega de marca de habla hispana.",
    "Genera una identidad de marca para el siguiente negocio.",
    "",
    `Marca: ${params.brandName}`,
    `Industria: ${params.industry || "no especificada"}`,
    `Palabras clave: ${params.keywords || "ninguna"}`,
    `Público objetivo: ${params.targetAudience || "general"}`,
    "",
    "Responde SOLO con un objeto JSON válido (sin markdown, sin explicación) con esta forma exacta:",
    "{",
    '  "palette": [{ "name": "string corto en español", "hex": "#RRGGBB" }, ... 4 o 5 colores ...],',
    '  "fonts": { "heading": "nombre de tipografía Google Fonts", "body": "nombre de tipografía Google Fonts" },',
    '  "slogan": "eslogan breve y memorable en español",',
    '  "tone": "descripción del tono de voz en 1 frase",',
    '  "copy": ["3 a 5 frases de marketing cortas en español"]',
    "}",
    "Los colores deben ser códigos hex de 6 dígitos coherentes entre sí.",
  ].join("\n");
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
};

/** Extract a JSON object from model text that may be fenced or padded. */
function parseJsonLoose(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("La respuesta de la IA no contenía JSON válido");
  }
}

export async function brandBrief(params: BriefParams): Promise<BrandBrief> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada");
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(params) }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        // Flash 2.x is a thinking model; spend the whole budget on the answer.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  const json = (await res.json().catch(() => ({}))) as GeminiResponse;
  if (!res.ok) {
    throw new Error(json.error?.message || `Gemini respondió ${res.status}`);
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini no devolvió contenido");
  }

  return coerceBrief(parseJsonLoose(text), params);
}
