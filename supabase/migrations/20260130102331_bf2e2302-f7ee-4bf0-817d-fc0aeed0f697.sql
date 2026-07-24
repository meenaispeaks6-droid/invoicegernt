-- Add pin_code column for invoice access protection (6-digit code stored as text)
ALTER TABLE public.invoices 
ADD COLUMN pin_code text DEFAULT lpad(floor(random() * 1000000)::text, 6, '0');

-- Add index for faster lookups
CREATE INDEX idx_invoices_pin_code ON public.invoices(pin_code);