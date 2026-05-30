-- ============================================================
-- Migration 20240010: Storage buckets and policies
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', false),
  ('proposal-pdfs', 'proposal-pdfs', false),
  ('project-files', 'project-files', false),
  ('template-assets', 'template-assets', false)
ON CONFLICT (id) DO NOTHING;

-- product-images: all authenticated users can read
CREATE POLICY "product_images_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-images' AND auth.uid() IS NOT NULL
  );

-- product-images: only admin can upload
CREATE POLICY "product_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND public.current_user_role() = 'admin'
  );

-- proposal-pdfs: authenticated users can read
CREATE POLICY "proposal_pdfs_read_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'proposal-pdfs' AND auth.uid() IS NOT NULL
  );

-- proposal-pdfs: server can write (via service role key — no check needed)
CREATE POLICY "proposal_pdfs_service_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'proposal-pdfs'
  );

-- project-files: authenticated users can read and upload
CREATE POLICY "project_files_authenticated" ON storage.objects
  FOR ALL USING (
    bucket_id = 'project-files' AND auth.uid() IS NOT NULL
  );

-- template-assets: all authenticated users can read
CREATE POLICY "template_assets_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'template-assets' AND auth.uid() IS NOT NULL
  );

-- template-assets: only admin can upload
CREATE POLICY "template_assets_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'template-assets'
    AND public.current_user_role() = 'admin'
  );
