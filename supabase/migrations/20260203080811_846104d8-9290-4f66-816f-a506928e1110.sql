-- Drop existing restrictive policies on clients table (with and without trailing space)
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;

-- Recreate as PERMISSIVE policies with TO authenticated
CREATE POLICY "Users can view their own clients"
ON public.clients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
ON public.clients
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);