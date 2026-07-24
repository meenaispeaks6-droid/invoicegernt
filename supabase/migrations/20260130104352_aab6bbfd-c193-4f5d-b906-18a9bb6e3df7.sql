-- Create payment instruction templates table
CREATE TABLE public.payment_instruction_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  intro_text TEXT,
  outro_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment details columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN payment_methods JSONB DEFAULT NULL,
ADD COLUMN payment_intro_text TEXT DEFAULT NULL,
ADD COLUMN payment_outro_text TEXT DEFAULT NULL,
ADD COLUMN payment_reference TEXT DEFAULT NULL;

-- Enable RLS on payment templates
ALTER TABLE public.payment_instruction_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment templates
CREATE POLICY "Users can view their own payment templates" 
ON public.payment_instruction_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment templates" 
ON public.payment_instruction_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment templates" 
ON public.payment_instruction_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment templates" 
ON public.payment_instruction_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on templates
CREATE TRIGGER update_payment_instruction_templates_updated_at
BEFORE UPDATE ON public.payment_instruction_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment explaining the JSONB structure
COMMENT ON COLUMN public.payment_instruction_templates.methods IS 'Array of payment methods: [{type: "bank_transfer", fields: {account_name: "", bsb: "", account_number: "", reference: ""}, enabled: true}, ...]';
COMMENT ON COLUMN public.invoices.payment_methods IS 'Array of payment methods with same structure as templates';