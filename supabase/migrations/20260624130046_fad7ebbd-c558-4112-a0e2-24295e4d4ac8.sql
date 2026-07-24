
-- Business settings table (one row per user)
CREATE TABLE public.business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  company_email text,
  company_phone text,
  logo_url text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  tax_id text,
  default_payment_terms text DEFAULT 'Net 30',
  payment_instructions text,
  invoice_number_prefix text DEFAULT 'INV-',
  default_currency text DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT ALL ON public.business_settings TO service_role;

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business settings"
  ON public.business_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business settings"
  ON public.business_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business settings"
  ON public.business_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business settings"
  ON public.business_settings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create default row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_business_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_settings (user_id, company_email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_business_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_business_settings();

-- Backfill existing users
INSERT INTO public.business_settings (user_id, company_email, company_name)
SELECT u.id, u.email, us.company_name
FROM auth.users u
LEFT JOIN public.user_settings us ON us.user_id = u.id
ON CONFLICT (user_id) DO NOTHING;
