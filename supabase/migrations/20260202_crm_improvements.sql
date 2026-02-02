-- ============================================================
-- Migration: CRM Improvements
-- Date: 2026-02-02
-- ============================================================

-- ============================================================
-- PHASE 1: Team Members Table
-- ============================================================

CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('sales', 'tech', 'both')),
  color TEXT,
  color_hex TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO team_members (name, slug, role, color, color_hex) VALUES
  ('Juan Pablo Gomez', 'juan_pablo_gomez', 'both', 'bg-blue-500', '#3B82F6'),
  ('Agustin Hoyos', 'agustin_hoyos', 'sales', 'bg-emerald-500', '#10B981'),
  ('Sara Garces', 'sara_garces', 'sales', 'bg-purple-500', '#8B5CF6'),
  ('Pamela Puello', 'pamela_puello', 'sales', 'bg-amber-500', '#F59E0B'),
  ('Juan David', 'juan_david', 'tech', 'bg-emerald-500', '#10B981'),
  ('Juan Jose', 'juan_jose', 'tech', 'bg-purple-500', '#8B5CF6');

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_team_members" ON team_members FOR SELECT TO authenticated USING (true);

-- ============================================================
-- PHASE 2: Loss Reasons on Leads
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS loss_reason TEXT CHECK (loss_reason IN (
    'PRECIO', 'TIMING', 'COMPETENCIA', 'SIN_PRESUPUESTO',
    'NO_RESPONDE', 'NO_NECESIDAD', 'OTRO'
  )),
  ADD COLUMN IF NOT EXISTS loss_reason_notes TEXT;

-- ============================================================
-- PHASE 3: Companies Table + Migration
-- ============================================================

-- Step 1: Create companies table
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT, contact_role TEXT, phone TEXT, email TEXT,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'client', 'churned')),
  channel TEXT, subchannel TEXT, owner_id TEXT,
  stage TEXT DEFAULT 'PROSPECTO',
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  product_tag TEXT,
  loss_reason TEXT, loss_reason_notes TEXT,
  notes TEXT, description TEXT, linkedin_url TEXT, website_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_companies" ON companies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Step 2: Migrate leads → companies
INSERT INTO companies (id, company_name, contact_name, contact_role, phone, email,
  status, channel, subchannel, owner_id, stage, stage_entered_at,
  last_activity_at, product_tag, loss_reason, loss_reason_notes,
  notes, description, linkedin_url, website_url, created_at, updated_at)
SELECT id, company_name, contact_name, contact_role, phone, email,
  CASE WHEN stage = 'CERRADO_GANADO' THEN 'client' ELSE 'prospect' END,
  channel, subchannel, owner_id, stage, stage_entered_at,
  last_activity_at, product_tag, loss_reason, loss_reason_notes,
  notes, description, linkedin_url, website_url, created_at, updated_at
FROM leads;

-- Step 3: Handle clients without lead (edge case)
INSERT INTO companies (id, company_name, contact_name, contact_role, phone, email,
  status, notes, description, linkedin_url, website_url, stage, created_at, updated_at)
SELECT id, company_name, contact_name, contact_role, phone, email,
  'client', notes, description, linkedin_url, website_url, 'CERRADO_GANADO', created_at, updated_at
FROM clients WHERE original_lead_id IS NULL;

UPDATE companies c SET status = 'client'
FROM clients cl WHERE cl.original_lead_id = c.id AND cl.original_lead_id IS NOT NULL;

-- Step 4: Unified contacts table
CREATE TABLE company_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, role TEXT, email TEXT, phone TEXT, description TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_company_contacts" ON company_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Migrate lead_contacts
INSERT INTO company_contacts (id, company_id, name, role, email, phone, description, is_primary, created_at, updated_at)
SELECT id, lead_id, name, role, email, phone, description, is_primary, created_at, updated_at FROM lead_contacts;

-- Migrate client_contacts (skip duplicates)
INSERT INTO company_contacts (id, company_id, name, role, email, phone, description, is_primary, created_at, updated_at)
SELECT cc.id, COALESCE(cl.original_lead_id, cl.id), cc.name, cc.role, cc.email, cc.phone, cc.description, cc.is_primary, cc.created_at, cc.updated_at
FROM client_contacts cc JOIN clients cl ON cl.id = cc.client_id
WHERE NOT EXISTS (SELECT 1 FROM company_contacts ec WHERE ec.id = cc.id);

-- Step 5: Add company_id to related tables
ALTER TABLE lead_stage_history ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
UPDATE lead_stage_history SET company_id = lead_id WHERE company_id IS NULL;

ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
UPDATE lead_activities SET company_id = lead_id WHERE company_id IS NULL;

ALTER TABLE company_documents ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
UPDATE company_documents SET company_id = COALESCE(lead_id, client_id) WHERE company_id IS NULL;

ALTER TABLE calls ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
UPDATE calls SET company_id = COALESCE(lead_id, client_id) WHERE company_id IS NULL;

ALTER TABLE deals ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
UPDATE deals SET company_id = lead_id WHERE company_id IS NULL;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
UPDATE projects p SET company_id = COALESCE(
  (SELECT cl.original_lead_id FROM clients cl WHERE cl.id = p.client_id),
  p.client_id
) WHERE p.company_id IS NULL;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE company_contacts;
