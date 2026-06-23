# Brand Forge

Plataforma web para generar assets de marca (imágenes y reels). Este repo
contiene la **Fase 1**: scaffold de la app, auth single-user por cookie, modelo
de datos en Postgres y UI de marcas.

> Las fases siguientes (motores Eikón/Reel Forge, API de agentes, deploy) aún no
> están implementadas. Ver `SPEC.md`.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Postgres** vía el cliente `pg` (sin ORM)

## Correr en local

```bash
npm install
cp .env.example .env        # editá las credenciales y, opcionalmente, DATABASE_URL
npm run dev                 # http://localhost:3000
```

La app arranca **aunque no haya base de datos**: las páginas de marcas muestran
un aviso de "DB no configurada" en vez de romper.

### Base de datos (opcional)

Con un Postgres disponible, definí `DATABASE_URL` y aplicá el schema:

```bash
export DATABASE_URL=postgres://user:pass@localhost:5432/brand_forge
npm run db:init             # crea las tablas (db/schema.sql)
```

También podés aplicarlo a mano: `psql "$DATABASE_URL" -f db/schema.sql`.

## Variables de entorno

| Variable         | Requerida | Default              | Descripción                                  |
| ---------------- | --------- | -------------------- | -------------------------------------------- |
| `ADMIN_USER`     | no        | `admin`              | Usuario del login                            |
| `ADMIN_PASS`     | no        | `changeme`           | Clave del login                              |
| `SESSION_SECRET` | sí (prod) | `dev-secret-change-me` | Secreto que firma la cookie de sesión      |
| `DATABASE_URL`   | no        | —                    | Conexión Postgres. Si falta, la DB se omite. |

## Estructura

```
db/schema.sql          Tablas: brands, jobs, assets
db/client.ts           Pool pg lazy + helper query()
middleware.ts          Protege todo excepto /login, /api/health, /api/login
src/lib/auth.ts        Helpers de credenciales y sesión
src/lib/brands.ts      Acceso a datos de marcas
src/app/               Páginas (home, login, brands/new, brands/[slug]) y API
```

## Endpoints

- `GET  /api/health` → `{ ok: true, db: <bool> }` (público)
- `POST /api/login` → setea cookie de sesión
- `POST /api/logout`
- `GET  /api/brands` · `POST /api/brands`
- `GET  /api/brands/[slug]`
