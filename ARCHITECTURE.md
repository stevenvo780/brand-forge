# Brand Forge — Arquitectura elevada (v2)

De "generador de assets" a **Brand OS**: el sistema operativo de marca de Humanizar.
Multi-tenant, con CRM, mensajería, generación de contenido y un cerebro de IA que
orquesta motores algorítmicos baratos.

## Principio rector
**Cerebro caro decide; manos baratas producen.**
La IA (API key) NO renderiza pixeles: recibe un brief y decide paleta, plantilla,
copy y composicion, luego llama a los motores algoritmicos (Playwright / WebGL).
Asi el costo por marca es de centavos, no de dolares.

## Capas
1. **Núcleo de datos (Postgres, multi-tenant)**
   org (cliente) -> brand -> {assets, jobs, contacts, campaigns, messages, conversations}
   Todo lleva org_id. Encaja con SuperAdmin/Humanizar que maneja varios clientes.

2. **CRM interno**
   - Clientes (empresas), contactos, pipeline/estados.
   - Marcas asociadas a cada cliente.
   - Historial de assets y campañas por cliente.

3. **Motores de generación (algorítmicos, gratis)**
   - Eikón: HTML templates -> Playwright -> PNG Hi-Res + validación WCAG.
   - Agora Reel: Three.js/WebGL + Piper TTS + MusicGen + ffmpeg -> MP4 9:16 (job async).
   - Copy Engine: generación de textos (slogans, captions, posts) — IA o plantillas.

4. **Cerebro de IA (orquestador, con API key)**
   - Recibe brief de marca -> decide identidad visual + copy -> invoca motores.
   - "Control general": asistente que opera la plataforma por lenguaje natural
     (crear marca, lanzar campaña, generar lote de posts).
   - Proveedor: Gemini Flash o MiniMax (barato). Aislado tras un servicio interno
     para poder cambiar de modelo sin tocar el resto.

5. **Mensajería**
   - Envío de contenidos/campañas por WhatsApp y email a contactos del CRM.
   - Cola de envíos + plantillas + tracking de estado (enviado/leído/respondido).

6. **API pública con API-key**
   - Para que agentes externos (o el OMS/SuperAdmin) generen marca programáticamente.
   - Rate-limit + scopes por key.

7. **Jobs / workers + storage**
   - Tabla jobs (ya existe) + worker para lo pesado (reels, lotes, envíos masivos).
   - Assets en bucket GCS (no blobs en DB); la DB guarda URLs + metadata.

## Cómo encaja con Humanizar
Brand Forge se vuelve un **servicio** que el SuperAdmin y el OMS pueden consumir
vía la API con key. No es un silo: es el módulo de identidad/contenido del ecosistema.

## Fases propuestas (sobre lo ya desplegado)
- F2: Motor de imágenes (Eikón) + UI de generación.            <- siguiente
- F3: Cerebro IA (brief -> identidad+copy) con API key.
- F4: CRM interno (clientes/contactos/marcas).
- F5: Mensajería (WhatsApp/email + campañas).
- F6: Motor de reels (Agora Reel, async).
- F7: API pública con API-key + hardening + QA.
