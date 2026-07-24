-- Add internal_title column for user's internal tracking
ALTER TABLE public.invoices 
ADD COLUMN internal_title TEXT;

-- Add unique constraint on invoice_number per user to prevent duplicates
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_user_invoice_number_unique 
UNIQUE (user_id, invoice_number);