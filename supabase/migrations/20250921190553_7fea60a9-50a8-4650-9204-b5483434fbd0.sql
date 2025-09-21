-- Habilitar RLS en todas las tablas para seguridad
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stage_history ENABLE ROW LEVEL SECURITY;

-- Crear políticas permisivas para permitir todas las operaciones (sin autenticación por ahora)
-- LEADS
CREATE POLICY "Allow all operations on leads" ON public.leads
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- DEALS
CREATE POLICY "Allow all operations on deals" ON public.deals
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- GOALS
CREATE POLICY "Allow all operations on goals" ON public.goals
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- LEAD_STAGE_HISTORY
CREATE POLICY "Allow all operations on lead_stage_history" ON public.lead_stage_history
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Corregir search_path en las funciones existentes
CREATE OR REPLACE FUNCTION public.leads_stage_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if new.stage is distinct from old.stage then
    insert into public.lead_stage_history(lead_id, from_stage, to_stage, changed_at, changed_by)
    values (old.id, old.stage, new.stage, now(), new.owner_id);
    new.stage_entered_at = now();
  end if;
  new.last_activity_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.autocreate_deal_on_won()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if new.stage = 'CERRADO_GANADO' and old.stage is distinct from new.stage then
    insert into public.deals(lead_id, mrr_usd, implementation_fee_usd, start_date, status, created_by)
    values (new.id, 0, 0, (now() at time zone 'America/Bogota')::date, 'ACTIVE', new.owner_id);
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.deals_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;