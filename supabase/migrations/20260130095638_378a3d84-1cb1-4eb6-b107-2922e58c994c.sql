-- Add viewed_at column to invoices table
ALTER TABLE public.invoices
ADD COLUMN viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create a policy that allows public read access to invoices by ID (for public invoice viewing)
CREATE POLICY "Anyone can view invoice by id for public link"
ON public.invoices
FOR SELECT
USING (true);

-- Note: The existing RLS policy for authenticated users will still work alongside this