-- Update bookings status check to include all needed statuses
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pre-arrival', 'checked-in', 'checked-out', 'cancelled', 'reserved', 'confirmed'));

-- Update booking_notifications type check to include all needed types
ALTER TABLE public.booking_notifications DROP CONSTRAINT IF EXISTS booking_notifications_type_check;
ALTER TABLE public.booking_notifications ADD CONSTRAINT booking_notifications_type_check 
CHECK (type IN ('new_reservation', 'reservation_confirmed', 'reservation_cancelled', 'check_in', 'check_out', 'payment'));