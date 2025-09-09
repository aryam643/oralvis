-- Create storage bucket for dental images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dental-images', 'dental-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dental-images' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow users to view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'dental-images');

CREATE POLICY "Allow users to update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'dental-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow users to delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'dental-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
