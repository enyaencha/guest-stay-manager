-- Recreate lookup_bookings_by_phone with timestamptz

DROP FUNCTION IF EXISTS public.lookup_bookings_by_phone(text);

CREATE OR REPLACE FUNCTION public.lookup_bookings_by_phone(
  phone_input text
)
RETURNS TABLE (
  guest_id uuid,
  guest_name text,
  booking_id uuid,
  room_number text,
  room_type text,
  check_in timestamptz,
  check_out timestamptz,
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
