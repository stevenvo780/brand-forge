# Brand Forge — Plataforma de generación de assets de marca (MVP)

Sistema web end-to-end para generar **imágenes** y **reels** de marca con
algoritmos (sin IA generativa cara de imagen/video). Pensado para que **agentes
de IA** (y personas) produzcan toda la identidad visual a partir de una
definición de marca, con lineamientos algorítmicos claros pero flexibles.

## Motores que envuelve (referencias de Steven)
- **Eikón** (`stevenvo780/creador-imagenes-de-marca`): plantillas HTML →
  Playwright Hi-Res PNG → validación WCAG AA. Imágenes de marca por JSON.
- **Reel Forge** (`stevenvo780/reel-forge`, basado en `agora-reel`): JSON →
  escena WebGL Three.js generativa + voz Piper TTS + música MusicGen →
  captura frame-by-frame (Playwright/Xvfb) → MP4 9:16. Fábrica de reels.

## Stack
- **Frontend/App:** Next.js 15 + Tailwind (alineado con Humanizar).
- **Auth:** login propio por cookie (como graf-superadmin) — MVP single-user/equipo.
- **DB:** Postgres (Cloud SQL emergentdb o Neon) — marcas, jobs, assets.
- **Storage:** GCS bucket para PNG/MP4 generados.
- **Render:** Eikón (imágenes) sincrónico; reels como **job async** (cola), porque
  WebGL+MusicGen+ffmpeg es pesado y lento (CPU/SwiftShader).
- **Deploy:** GCP Cloud Run (emergent-enterprises, us-central1). ⚠️ acceso/deploy se
  coordina con Steven.

## Funcionalidad MVP
1. **Definir marca**: form/JSON (colores, tipografía, logo, textos, paleta).
2. **Generar imágenes** (Eikón): elegir categorías (logos/social/print/web),
   render, validación WCAG, galería con descarga.
3. **Generar reel** (Reel Forge): guion + tema (constellation/waves), encolar job,
   ver progreso, descargar MP4 + poster + versión solo-música.
4. **Galería de assets** por marca, con metadatos y reintento.
5. **API para agentes de IA**: endpoints REST (crear marca, lanzar render, consultar
   job, listar assets) + API key, para que un agente complete toda la imagen de marca.

## Fases
- F1: scaffold + auth + modelo de datos + UI marcas.
- F2: integrar motor Eikón (imágenes sync) + galería + storage.
- F3: integrar Reel Forge (reels async + cola + progreso).
- F4: API de agentes + API keys + docs.
- F5: QA local end-to-end → coordinar deploy con Steven.

🤖 Spec inicial por Janus
