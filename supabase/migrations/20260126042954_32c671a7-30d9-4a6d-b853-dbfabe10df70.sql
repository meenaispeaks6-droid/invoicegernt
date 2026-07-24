-- Add new fields to clients table for detailed client profile
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'AUD',
ADD COLUMN IF NOT EXISTS payment_terms integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS notes text;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.tax_id IS 'Client tax identification number';
COMMENT ON COLUMN public.clients.preferred_currency IS 'Client preferred currency code (e.g., AUD, USD)';
COMMENT ON COLUMN public.clients.payment_terms IS 'Payment terms in days';
COMMENT ON COLUMN public.clients.status IS 'Client status: active, inactive, archived';
COMMENT ON COLUMN public.clients.notes IS 'Internal notes about the client';