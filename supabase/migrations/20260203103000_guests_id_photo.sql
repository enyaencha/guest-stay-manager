-- Add optional ID photo to guests and bucket policies

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS id_photo_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-ids', 'guest-ids', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can read guest ids" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload guest ids" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update guest ids" ON storage.objects;

CREATE POLICY "Authenticated can read guest ids"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'guest-ids');

CREATE POLICY "Authenticated can upload guest ids"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'guest-ids');

CREATE POLICY "Authenticated can update guest ids"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'guest-ids')
  WITH CHECK (bucket_id = 'guest-ids');
