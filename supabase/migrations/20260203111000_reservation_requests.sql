-- Reservation requests (not bookings)

CREATE TABLE IF NOT EXISTS public.reservation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  request_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reservation_requests
  ADD CONSTRAINT reservation_requests_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled'));

CREATE INDEX IF NOT EXISTS reservation_requests_status_idx ON public.reservation_requests(status);
CREATE INDEX IF NOT EXISTS reservation_requests_created_at_idx ON public.reservation_requests(created_at);

ALTER TABLE public.reservation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reservation requests"
  ON public.reservation_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reservation requests"
  ON public.reservation_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reservation requests"
  ON public.reservation_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);
