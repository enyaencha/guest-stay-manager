-- Store booking check-in/out with time

ALTER TABLE public.bookings
  ALTER COLUMN check_in TYPE timestamptz USING check_in::timestamptz,
  ALTER COLUMN check_out TYPE timestamptz USING check_out::timestamptz;
