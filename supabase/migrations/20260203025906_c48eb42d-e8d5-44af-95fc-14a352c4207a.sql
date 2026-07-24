-- Fix 1: Update the update_updated_at_column() function with SECURITY INVOKER and empty search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';

-- Fix 2: Create a secure RPC function to fetch invoice PIN only when explicitly needed
CREATE OR REPLACE FUNCTION public.get_invoice_pin(invoice_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT pin_code FROM public.invoices 
  WHERE id = invoice_id AND user_id = auth.uid();
$$;