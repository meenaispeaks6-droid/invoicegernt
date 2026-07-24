
-- 1. Scope RLS policies to authenticated role explicitly

-- invoice_items
DROP POLICY IF EXISTS "Users can create their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update their invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can view their invoice items" ON public.invoice_items;

CREATE POLICY "Users can create their invoice items" ON public.invoice_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete their invoice items" ON public.invoice_items
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can update their invoice items" ON public.invoice_items
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can view their invoice items" ON public.invoice_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

-- invoices
DROP POLICY IF EXISTS "Users can create their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;

CREATE POLICY "Users can create their own invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- user_settings
DROP POLICY IF EXISTS "Users can create their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;

CREATE POLICY "Users can create their own settings" ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- payment_instruction_templates
DROP POLICY IF EXISTS "Users can create their own payment templates" ON public.payment_instruction_templates;
DROP POLICY IF EXISTS "Users can delete their own payment templates" ON public.payment_instruction_templates;
DROP POLICY IF EXISTS "Users can update their own payment templates" ON public.payment_instruction_templates;
DROP POLICY IF EXISTS "Users can view their own payment templates" ON public.payment_instruction_templates;

CREATE POLICY "Users can create their own payment templates" ON public.payment_instruction_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payment templates" ON public.payment_instruction_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment templates" ON public.payment_instruction_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own payment templates" ON public.payment_instruction_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Drop unused SECURITY DEFINER function (replaced by edge function flow)
DROP FUNCTION IF EXISTS public.get_invoice_pin(uuid);

-- Revoke execute on trigger helper from API roles
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3. Restrict public bucket listing on invoice-logos
DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;
-- Files remain accessible via direct public URL (bucket is public); listing API now blocked.
