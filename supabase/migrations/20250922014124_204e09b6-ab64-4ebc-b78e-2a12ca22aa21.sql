-- Add product_tag column to leads table
ALTER TABLE public.leads 
ADD COLUMN product_tag TEXT NOT NULL DEFAULT 'WhatsApp';

-- Create an index for better performance when filtering by product tag
CREATE INDEX idx_leads_product_tag ON public.leads(product_tag);