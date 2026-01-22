-- Create staff_secrets table for access code verification
CREATE TABLE public.staff_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_code text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_secrets ENABLE ROW LEVEL SECURITY;

-- Only allow select for verification (no direct access to codes)
CREATE POLICY "No direct read access to staff_secrets"
  ON public.staff_secrets FOR SELECT
  USING (false);

-- Insert the default staff secret code
INSERT INTO public.staff_secrets (secret_code, description)
VALUES ('HAVEN2026', 'Default staff access code');

-- Create verify_staff_secret function
CREATE OR REPLACE FUNCTION public.verify_staff_secret(_secret text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff_secrets
    WHERE secret_code = _secret AND is_active = true
  );
END;
$$;

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create has_role function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_role_name text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.name = _role_name
      AND ur.is_active = true
      AND (ur.valid_until IS NULL OR ur.valid_until > now())
  );
$$;

-- Create get_user_permissions function
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT perm),
    ARRAY[]::text[]
  )
  FROM (
    SELECT unnest(r.permissions)::text as perm
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND ur.is_active = true
      AND (ur.valid_until IS NULL OR ur.valid_until > now())
  ) perms;
$$;