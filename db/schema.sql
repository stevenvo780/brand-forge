-- Brand Forge — schema (Phase 1)
-- Run against your Postgres database:  psql "$DATABASE_URL" -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('image', 'reel')),
  status      TEXT NOT NULL DEFAULT 'pending',
  params      JSONB NOT NULL DEFAULT '{}'::jsonb,
  result      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  job_id      UUID REFERENCES jobs(id) ON DELETE SET NULL,
  kind        TEXT NOT NULL,
  url         TEXT NOT NULL,
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_brand_id   ON jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_assets_brand_id ON assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_assets_job_id   ON assets(job_id);

-- ---------------------------------------------------------------------------
-- Phase 4 — CRM (orgs / contacts / pipelines) + brand ownership
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS orgs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  industry    TEXT,
  website     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  role        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pipelines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
  stage       TEXT NOT NULL DEFAULT 'lead'
                CHECK (stage IN ('lead', 'prospect', 'client', 'churned')),
  value       NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brands optionally belong to an org (nullable for now).
ALTER TABLE brands ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES orgs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_org_id  ON contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_org_id ON pipelines(org_id);
CREATE INDEX IF NOT EXISTS idx_brands_org_id    ON brands(org_id);

-- ---------------------------------------------------------------------------
-- Phase 5 — Messaging (email now, WhatsApp infra-ready)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES orgs(id) ON DELETE SET NULL,
  contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
  channel     TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  subject     TEXT,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'queued', 'sent', 'failed')),
  error       TEXT,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_org_id     ON messages(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);

-- ---------------------------------------------------------------------------
-- Phase 7 — Public API keys
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES orgs(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,
  prefix        TEXT NOT NULL,
  scopes        TEXT[] NOT NULL DEFAULT '{}',
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
