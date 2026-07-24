-- Create storage bucket for invoice logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-logos', 'invoice-logos', true);

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoice-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'invoice-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'invoice-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to logos (needed for invoice display)
CREATE POLICY "Logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invoice-logos');