-- Add invoice customization fields and property logo bucket

ALTER TABLE public.property_settings
  ADD COLUMN IF NOT EXISTS tax_pin TEXT,
  ADD COLUMN IF NOT EXISTS vat_rate DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_footer TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-logos', 'property-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can read property logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload property logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update property logos" ON storage.objects;

CREATE POLICY "Authenticated can read property logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-logos');

CREATE POLICY "Authenticated can upload property logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-logos');

CREATE POLICY "Authenticated can update property logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'property-logos')
  WITH CHECK (bucket_id = 'property-logos');
