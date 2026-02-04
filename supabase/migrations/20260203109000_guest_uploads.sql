-- Add guest document uploads

CREATE TABLE IF NOT EXISTS public.guest_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guest_uploads_guest_id_idx ON public.guest_uploads(guest_id);
CREATE INDEX IF NOT EXISTS guest_uploads_uploaded_at_idx ON public.guest_uploads(uploaded_at);

ALTER TABLE public.guest_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read guest uploads"
  ON public.guest_uploads FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert guest uploads"
  ON public.guest_uploads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update guest uploads"
  ON public.guest_uploads FOR UPDATE
  USING (true)
  WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-docs', 'guest-docs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can read guest docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload guest docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update guest docs" ON storage.objects;

CREATE POLICY "Authenticated can read guest docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'guest-docs');

CREATE POLICY "Authenticated can upload guest docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'guest-docs');

CREATE POLICY "Authenticated can update guest docs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'guest-docs')
  WITH CHECK (bucket_id = 'guest-docs');
