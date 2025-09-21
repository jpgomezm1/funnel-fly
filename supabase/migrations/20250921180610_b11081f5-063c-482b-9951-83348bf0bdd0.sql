-- Enums para etapas, canales y subcanales
create type public.lead_stage as enum (
  'PROSPECTO',
  'CONTACTADO',
  'DESCUBRIMIENTO',
  'DEMOSTRACION',
  'PROPUESTA',
  'CERRADO_GANADO',
  'CERRADO_PERDIDO'
);

create type public.lead_channel as enum (
  'OUTBOUND_APOLLO',
  'WARM_INTRO',
  'INBOUND_REDES'
);

create type public.lead_subchannel as enum (
  'NINGUNO',
  'INSTAGRAM',
  'TIKTOK',
  'LINKEDIN',
  'OTRO'
);

-- Tabla principal de leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_role text,
  phone text,
  email text,
  channel lead_channel not null default 'OUTBOUND_APOLLO',
  subchannel lead_subchannel not null default 'NINGUNO',
  owner_id uuid,
  stage lead_stage not null default 'PROSPECTO',
  stage_entered_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Historial de cambios de etapa
create table public.lead_stage_history (
  id bigserial primary key,
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_stage lead_stage,
  to_stage lead_stage not null,
  changed_at timestamptz not null default now(),
  changed_by uuid
);

-- Índices
create index leads_stage_idx on public.leads(stage);
create index leads_owner_idx on public.leads(owner_id);
create index leads_created_at_idx on public.leads(created_at);
create index leads_stage_entered_idx on public.leads(stage_entered_at);
create index history_lead_idx on public.lead_stage_history(lead_id);
create index history_changed_at_idx on public.lead_stage_history(changed_at);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_leads_updated_at
before update on public.leads
for each row execute procedure public.set_updated_at();

-- Trigger de auditoría de stage
create or replace function public.leads_stage_audit()
returns trigger as $$
begin
  if new.stage is distinct from old.stage then
    insert into public.lead_stage_history(lead_id, from_stage, to_stage, changed_at, changed_by)
    values (old.id, old.stage, new.stage, now(), new.owner_id);
    new.stage_entered_at = now();
  end if;
  new.last_activity_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_leads_stage_audit
before update on public.leads
for each row execute procedure public.leads_stage_audit();

-- RLS OFF para acceso colaborativo
alter table public.leads disable row level security;
alter table public.lead_stage_history disable row level security;

-- Insertar datos demo
INSERT INTO public.leads (company_name, contact_name, contact_role, phone, email, channel, subchannel, stage, notes) VALUES
('Tech Solutions SA', 'Carlos Mendoza', 'CEO', '+57 300 123 4567', 'carlos@techsolutions.com', 'OUTBOUND_APOLLO', 'NINGUNO', 'CONTACTADO', 'Interesado en automatización'),
('Digital Marketing Pro', 'Ana García', 'Gerente Marketing', '+57 301 234 5678', 'ana@digitalmkt.com', 'INBOUND_REDES', 'INSTAGRAM', 'DESCUBRIMIENTO', 'Vino por post de Instagram'),
('Retail Express', 'Luis Rodríguez', 'Director Comercial', '+57 302 345 6789', 'luis@retailexpress.com', 'WARM_INTRO', 'NINGUNO', 'DEMOSTRACION', 'Referido por cliente existente'),
('StartupCo', 'María Fernández', 'Fundadora', '+57 303 456 7890', 'maria@startupco.com', 'INBOUND_REDES', 'LINKEDIN', 'PROPUESTA', 'Muy interesada, envié propuesta'),
('Construcciones ABC', 'Jorge Pérez', 'Gerente', '+57 304 567 8901', 'jorge@construcciones.com', 'OUTBOUND_APOLLO', 'NINGUNO', 'PROSPECTO', 'Primer contacto'),
('E-commerce Plus', 'Laura Sánchez', 'CMO', '+57 305 678 9012', 'laura@ecommerceplus.com', 'INBOUND_REDES', 'TIKTOK', 'CERRADO_GANADO', 'Cliente cerrado exitosamente'),
('Consultoría Empresarial', 'Roberto Torres', 'Socio', '+57 306 789 0123', 'roberto@consultoria.com', 'WARM_INTRO', 'NINGUNO', 'CERRADO_PERDIDO', 'No tenía presupuesto'),
('Farmacia Central', 'Patricia López', 'Administradora', '+57 307 890 1234', 'patricia@farmacia.com', 'OUTBOUND_APOLLO', 'NINGUNO', 'CONTACTADO', 'Respondió email, programar llamada');