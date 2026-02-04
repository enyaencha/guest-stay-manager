-- Add apply_settings toggles for property and system preferences

ALTER TABLE public.property_settings
  ADD COLUMN IF NOT EXISTS apply_settings BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.system_preferences
  ADD COLUMN IF NOT EXISTS apply_settings BOOLEAN NOT NULL DEFAULT true;
