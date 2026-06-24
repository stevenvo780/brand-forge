import type { Brand } from "./brands";

export type TemplateFields = {
  titulo?: string;
  subtitulo?: string;
};

export type TemplateOutput = {
  html: string;
  width: number;
  height: number;
};

export type TemplateBuilder = (
  brand: Brand,
  fields: TemplateFields
) => TemplateOutput;

export type TemplateMeta = {
  id: string;
  label: string;
  width: number;
  height: number;
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/**
 * Brand.data shape in this app: { colors: { primary, secondary }, typography:
 * { fontFamily }, texts: {...} }. The original spec referenced
 * colorPrimario/colorSecundario/slogan, so we read both shapes defensively.
 */
function readBrand(brand: Brand) {
  const data = (brand.data ?? {}) as Record<string, unknown>;
  const colors = (data.colors ?? {}) as Record<string, string>;
  const texts = (data.texts ?? {}) as Record<string, unknown>;

  const primary =
    colors.primary ||
    (data.colorPrimario as string) ||
    "#4f46e5";
  const secondary =
    colors.secondary ||
    (data.colorSecundario as string) ||
    "#22d3ee";
  const slogan =
    (data.slogan as string) ||
    (texts.tagline as string) ||
    brand.name;

  return { primary, secondary, slogan };
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isLightColor(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  // Perceived luminance.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6;
}

function baseStyles(primary: string, secondary: string) {
  const textColor = isLightColor(primary) ? "#111827" : "#ffffff";
  const subText = isLightColor(primary)
    ? "rgba(17,24,39,0.75)"
    : "rgba(255,255,255,0.82)";
  const footerText = isLightColor(primary)
    ? "rgba(17,24,39,0.6)"
    : "rgba(255,255,255,0.7)";
  return { textColor, subText, footerText };
}

const buildPostCuadrado: TemplateBuilder = (brand, fields) => {
  const width = 1080;
  const height = 1080;
  const { primary, secondary, slogan } = readBrand(brand);
  const { textColor, subText, footerText } = baseStyles(primary, secondary);
  const titulo = fields.titulo || brand.name;
  const subtitulo = fields.subtitulo || "";

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${width}px; height: ${height}px; }
  body {
    font-family: ${FONT_STACK};
    background: linear-gradient(135deg, ${esc(primary)} 0%, ${esc(secondary)} 100%);
    color: ${textColor};
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 110px 100px;
    position: relative;
    overflow: hidden;
  }
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(2px);
    opacity: 0.22;
    background: ${textColor};
  }
  .blob.a { width: 540px; height: 540px; top: -180px; right: -160px; }
  .blob.b { width: 360px; height: 360px; bottom: -140px; left: -120px; }
  .content { position: relative; z-index: 1; }
  .titulo {
    font-size: 96px;
    font-weight: 800;
    line-height: 1.04;
    letter-spacing: -0.02em;
    max-width: 14ch;
  }
  .subtitulo {
    margin-top: 36px;
    font-size: 44px;
    font-weight: 500;
    line-height: 1.3;
    color: ${subText};
    max-width: 24ch;
  }
  .footer {
    position: absolute;
    left: 100px;
    bottom: 80px;
    right: 100px;
    display: flex;
    align-items: center;
    gap: 18px;
    font-size: 30px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${footerText};
    z-index: 1;
  }
  .dot { width: 18px; height: 18px; border-radius: 50%; background: ${textColor}; }
</style>
</head>
<body>
  <div class="blob a"></div>
  <div class="blob b"></div>
  <div class="content">
    <div class="titulo">${esc(titulo)}</div>
    ${subtitulo ? `<div class="subtitulo">${esc(subtitulo)}</div>` : ""}
  </div>
  <div class="footer"><span class="dot"></span>${esc(slogan)}</div>
</body>
</html>`;

  return { html, width, height };
};

const buildStory: TemplateBuilder = (brand, fields) => {
  const width = 1080;
  const height = 1920;
  const { primary, secondary, slogan } = readBrand(brand);
  const { textColor, subText, footerText } = baseStyles(primary, secondary);
  const titulo = fields.titulo || brand.name;
  const subtitulo = fields.subtitulo || "";

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${width}px; height: ${height}px; }
  body {
    font-family: ${FONT_STACK};
    background: linear-gradient(160deg, ${esc(primary)} 0%, ${esc(secondary)} 100%);
    color: ${textColor};
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 160px 110px;
    position: relative;
    overflow: hidden;
  }
  .ring {
    position: absolute;
    border: 60px solid ${textColor};
    border-radius: 50%;
    opacity: 0.12;
  }
  .ring.a { width: 720px; height: 720px; top: -220px; left: -200px; }
  .ring.b { width: 520px; height: 520px; bottom: -160px; right: -180px; }
  .kicker {
    position: relative;
    z-index: 1;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${footerText};
    margin-bottom: 40px;
  }
  .titulo {
    position: relative;
    z-index: 1;
    font-size: 120px;
    font-weight: 800;
    line-height: 1.02;
    letter-spacing: -0.02em;
    max-width: 12ch;
  }
  .subtitulo {
    position: relative;
    z-index: 1;
    margin-top: 48px;
    font-size: 52px;
    font-weight: 500;
    line-height: 1.3;
    color: ${subText};
    max-width: 18ch;
  }
  .footer {
    position: absolute;
    left: 110px;
    bottom: 130px;
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${footerText};
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .dot { width: 22px; height: 22px; border-radius: 50%; background: ${textColor}; }
</style>
</head>
<body>
  <div class="ring a"></div>
  <div class="ring b"></div>
  <div class="kicker">${esc(brand.name)}</div>
  <div class="titulo">${esc(titulo)}</div>
  ${subtitulo ? `<div class="subtitulo">${esc(subtitulo)}</div>` : ""}
  <div class="footer"><span class="dot"></span>${esc(slogan)}</div>
</body>
</html>`;

  return { html, width, height };
};

const buildBanner: TemplateBuilder = (brand, fields) => {
  const width = 1200;
  const height = 630;
  const { primary, secondary, slogan } = readBrand(brand);
  const { textColor, subText, footerText } = baseStyles(primary, secondary);
  const titulo = fields.titulo || brand.name;
  const subtitulo = fields.subtitulo || "";

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${width}px; height: ${height}px; }
  body {
    font-family: ${FONT_STACK};
    background: linear-gradient(115deg, ${esc(primary)} 0%, ${esc(secondary)} 100%);
    color: ${textColor};
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 90px;
    position: relative;
    overflow: hidden;
  }
  .stripe {
    position: absolute;
    top: 0;
    bottom: 0;
    right: -120px;
    width: 380px;
    background: ${textColor};
    opacity: 0.1;
    transform: skewX(-12deg);
  }
  .titulo {
    position: relative;
    z-index: 1;
    font-size: 78px;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
    max-width: 16ch;
  }
  .subtitulo {
    position: relative;
    z-index: 1;
    margin-top: 24px;
    font-size: 34px;
    font-weight: 500;
    line-height: 1.3;
    color: ${subText};
    max-width: 28ch;
  }
  .footer {
    position: absolute;
    left: 90px;
    bottom: 56px;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${footerText};
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: ${textColor}; }
</style>
</head>
<body>
  <div class="stripe"></div>
  <div class="titulo">${esc(titulo)}</div>
  ${subtitulo ? `<div class="subtitulo">${esc(subtitulo)}</div>` : ""}
  <div class="footer"><span class="dot"></span>${esc(slogan)}</div>
</body>
</html>`;

  return { html, width, height };
};

export const TEMPLATES: Record<string, TemplateBuilder> = {
  "post-cuadrado": buildPostCuadrado,
  story: buildStory,
  banner: buildBanner,
};

export const TEMPLATE_LIST: TemplateMeta[] = [
  { id: "post-cuadrado", label: "Post cuadrado", width: 1080, height: 1080 },
  { id: "story", label: "Story", width: 1080, height: 1920 },
  { id: "banner", label: "Banner", width: 1200, height: 630 },
];

export function isKnownTemplate(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(TEMPLATES, id);
}
