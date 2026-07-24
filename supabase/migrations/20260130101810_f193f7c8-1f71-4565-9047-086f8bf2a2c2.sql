-- Add share_token column for secure public access
ALTER TABLE public.invoices 
ADD COLUMN share_token uuid DEFAULT gen_random_uuid();

-- Create index for faster token lookups
CREATE INDEX idx_invoices_share_token ON public.invoices(share_token);

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view invoice by id for public link" ON public.invoices;