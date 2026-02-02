-- Allow public booking lookup/creation via security definer functions

CREATE OR REPLACE FUNCTION public.get_or_create_guest(
  name_input text,
  phone_input text,
  email_input text,
  id_number_input text
)
RETURNS TABLE (
  id uuid,
  name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_row public.guests%ROWTYPE;
BEGIN
  SELECT *
    INTO guest_row
    FROM public.guests
    WHERE phone = phone_input
    LIMIT 1;

  IF guest_row.id IS NULL THEN
    INSERT INTO public.guests (name, phone, email, id_number)
    VALUES (name_input, phone_input, email_input, id_number_input)
    RETURNING * INTO guest_row;
  END IF;

  RETURN QUERY
    SELECT guest_row.id, guest_row.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.lookup_bookings_by_phone(
  phone_input text
)
RETURNS TABLE (
  guest_id uuid,
  guest_name text,
  booking_id uuid,
  room_number text,
  room_type text,
  check_in date,
  check_out date,
  guests_count integer,
  total_amount numeric,
  paid_amount numeric,
  status text,
  special_requests text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id AS guest_id,
    g.name AS guest_name,
    b.id AS booking_id,
    b.room_number,
    b.room_type,
    b.check_in,
    b.check_out,
    b.guests_count,
    b.total_amount,
    b.paid_amount,
    b.status,
    b.special_requests,
    b.created_at
  FROM public.guests g
  JOIN public.bookings b ON b.guest_id = g.id
  WHERE g.phone = phone_input
  ORDER BY b.check_in DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_guest(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_bookings_by_phone(text) TO anon, authenticated;
