-- Lookup an existing guest by phone for reservation prefill workflows.
-- SECURITY DEFINER allows controlled access without exposing full guests table reads.

CREATE OR REPLACE FUNCTION public.lookup_guest_profile_by_phone(
  phone_input text
)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  email text,
  id_number text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id,
    g.name,
    g.phone,
    g.email,
    g.id_number
  FROM public.guests g
  WHERE regexp_replace(coalesce(g.phone, ''), '\D', '', 'g')
      = regexp_replace(coalesce(phone_input, ''), '\D', '', 'g')
  ORDER BY g.updated_at DESC, g.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_guest_profile_by_phone(text) TO anon, authenticated;
