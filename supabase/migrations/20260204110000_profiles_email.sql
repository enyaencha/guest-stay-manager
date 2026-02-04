-- Store user email in profiles for user management

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;
