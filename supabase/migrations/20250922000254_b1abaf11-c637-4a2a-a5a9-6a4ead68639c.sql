-- Create lead_activities table to store activity logs
CREATE TABLE public.lead_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'quote', 'follow_up')),
  description text NOT NULL,
  details text,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all operations on lead_activities" 
ON public.lead_activities 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_lead_activities_updated_at
BEFORE UPDATE ON public.lead_activities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();