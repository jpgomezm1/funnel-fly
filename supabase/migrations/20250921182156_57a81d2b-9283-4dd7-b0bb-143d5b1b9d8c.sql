-- 1) Enum deal_status (idempotente)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'deal_status') then
    create type public.deal_status as enum ('ACTIVE','CHURNED','ON_HOLD');
  end if;
end$$;

-- 2) Tabla deals (idempotente)
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  mrr_usd numeric(12,2) not null check (mrr_usd >= 0),
  implementation_fee_usd numeric(12,2) not null default 0 check (implementation_fee_usd >= 0),
  start_date date not null default (now() at time zone 'America/Bogota')::date,
  status public.deal_status not null default 'ACTIVE',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deals_lead_idx on public.deals(lead_id);
create index if not exists deals_status_idx on public.deals(status);
create index if not exists deals_start_idx on public.deals(start_date);

-- Trigger updated_at en deals
create or replace function public.deals_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_deals_updated_at on public.deals;
create trigger trg_deals_updated_at
before update on public.deals
for each row execute procedure public.deals_set_updated_at();

-- 3) Tabla goals (idempotente)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  goal_type text not null check (goal_type in ('MRR_GLOBAL_USD')),
  period text not null check (period in ('GLOBAL')),
  value_usd numeric(12,2) not null check (value_usd >= 0),
  effective_from date not null default (now() at time zone 'America/Bogota')::date,
  created_at timestamptz not null default now(),
  unique (goal_type, period, effective_from)
);

-- Semilla 50k si no existe
insert into public.goals(goal_type, period, value_usd)
select 'MRR_GLOBAL_USD','GLOBAL',50000
where not exists (
  select 1 from public.goals where goal_type='MRR_GLOBAL_USD' and period='GLOBAL'
);

-- 4) Trigger opcional: autocrear deal "borrador" al cerrar Ganado
create or replace function public.autocreate_deal_on_won()
returns trigger as $$
begin
  if new.stage = 'CERRADO_GANADO' and old.stage is distinct from new.stage then
    insert into public.deals(lead_id, mrr_usd, implementation_fee_usd, start_date, status, created_by)
    values (new.id, 0, 0, (now() at time zone 'America/Bogota')::date, 'ACTIVE', new.owner_id);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_autocreate_deal_on_won on public.leads;
create trigger trg_autocreate_deal_on_won
after update on public.leads
for each row execute procedure public.autocreate_deal_on_won();

-- 5) RLS OFF
alter table public.deals disable row level security;
alter table public.goals disable row level security;