-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('paid', 'pending', 'draft', 'overdue')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice line items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  company_name TEXT,
  avatar_url TEXT,
  email_notifications BOOLEAN DEFAULT true,
  invoice_reminders BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

-- Invoice items policies (based on invoice ownership)
CREATE POLICY "Users can view their invoice items" ON public.invoice_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can create their invoice items" ON public.invoice_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can update their invoice items" ON public.invoice_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete their invoice items" ON public.invoice_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

-- User settings policies
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();