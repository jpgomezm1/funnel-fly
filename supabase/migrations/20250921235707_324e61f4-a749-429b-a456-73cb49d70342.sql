-- Fix the autocreate_deal_on_won function to handle the type mismatch
-- The issue is that owner_id is TEXT but created_by in deals table is UUID
CREATE OR REPLACE FUNCTION public.autocreate_deal_on_won()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if new.stage = 'CERRADO_GANADO' and old.stage is distinct from new.stage then
    -- Insert deal without created_by since owner_id is text and created_by expects uuid
    insert into public.deals(lead_id, mrr_usd, implementation_fee_usd, start_date, status)
    values (new.id, 0, 0, (now() at time zone 'America/Bogota')::date, 'ACTIVE');
  end if;
  return new;
end;
$function$;