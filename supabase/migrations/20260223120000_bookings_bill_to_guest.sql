-- Support split stay-vs-billing guest ownership for company/group reservations.
-- guest_id: guest physically staying in the room
-- bill_to_guest_id: reservation owner/company account carrying cumulative charges

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS bill_to_guest_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_bill_to_guest_id_fkey'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_bill_to_guest_id_fkey
      FOREIGN KEY (bill_to_guest_id)
      REFERENCES public.guests(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

UPDATE public.bookings
SET bill_to_guest_id = guest_id
WHERE bill_to_guest_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_bill_to_guest_id
ON public.bookings(bill_to_guest_id);

-- Booking lookup should follow billing owner (fallback to stay guest for legacy rows).
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
  JOIN public.bookings b ON COALESCE(b.bill_to_guest_id, b.guest_id) = g.id
  WHERE regexp_replace(coalesce(g.phone, ''), '\D', '', 'g')
      = regexp_replace(coalesce(phone_input, ''), '\D', '', 'g')
  ORDER BY b.check_in DESC;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_bookings_by_phone(text) TO anon, authenticated;
