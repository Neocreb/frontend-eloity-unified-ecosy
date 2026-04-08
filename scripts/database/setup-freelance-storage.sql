-- ============================================================================
-- FREELANCE STORAGE SETUP
-- Creates storage bucket for freelance attachments (messages, job proposals, etc)
-- ============================================================================

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'freelance-attachments',
  'freelance-attachments',
  false,
  52428800, -- 50MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS POLICIES FOR STORAGE
-- ============================================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can upload files to freelance-attachments bucket
CREATE POLICY "Users can upload freelance attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'freelance-attachments');

-- Policy: Authenticated users can read (download) their own and shared attachments
CREATE POLICY "Users can download freelance attachments"
ON storage.objects FOR SELECT TO authenticated
WHERE bucket_id = 'freelance-attachments';

-- Policy: Users can update their own uploaded files
CREATE POLICY "Users can update their freelance attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'freelance-attachments' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'freelance-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own uploaded files
CREATE POLICY "Users can delete their freelance attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'freelance-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this query to verify storage bucket setup:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'freelance-attachments';
