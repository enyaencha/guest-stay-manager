-- Allow booking_notifications to reference reservation requests

ALTER TABLE public.booking_notifications
  ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE public.booking_notifications
  ADD COLUMN IF NOT EXISTS reservation_request_id UUID REFERENCES public.reservation_requests(id) ON DELETE CASCADE;

ALTER TABLE public.booking_notifications
  DROP CONSTRAINT IF EXISTS booking_notifications_reference_check;

ALTER TABLE public.booking_notifications
  ADD CONSTRAINT booking_notifications_reference_check
  CHECK (
    booking_id IS NOT NULL OR reservation_request_id IS NOT NULL
  );
