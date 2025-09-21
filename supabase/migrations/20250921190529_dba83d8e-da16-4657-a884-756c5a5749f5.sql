-- Cambiar el tipo de owner_id de UUID a TEXT para permitir nombres de comerciales
ALTER TABLE public.leads ALTER COLUMN owner_id TYPE TEXT;

-- También cambiar en lead_stage_history para consistencia
ALTER TABLE public.lead_stage_history ALTER COLUMN changed_by TYPE TEXT;