-- Drop existing function and recreate with correct return type
DROP FUNCTION IF EXISTS public.get_user_permissions(uuid);

-- Create function to get user's permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT unnest)
  FROM (
    SELECT unnest(r.permissions::text[])
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND ur.is_active = true
      AND (ur.valid_until IS NULL OR ur.valid_until > now())
  ) AS perms
$$;