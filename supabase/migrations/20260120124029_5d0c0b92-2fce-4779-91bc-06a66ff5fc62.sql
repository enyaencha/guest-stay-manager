-- 1. Update bookings status constraint to include 'reserved'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status = ANY (ARRAY['pre-arrival'::text, 'checked-in'::text, 'checked-out'::text, 'cancelled'::text, 'no-show'::text, 'reserved'::text]));

-- 2. Create reviews table for guest feedback
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies - anyone can read approved reviews, anyone can insert
CREATE POLICY "Anyone can read approved reviews" 
  ON public.reviews FOR SELECT 
  USING (is_approved = true);

CREATE POLICY "Anyone can insert reviews" 
  ON public.reviews FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reviews" 
  ON public.reviews FOR UPDATE 
  USING (true);

-- 3. Create booking_notifications table
CREATE TABLE public.booking_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type = ANY (ARRAY['new_reservation'::text, 'confirmation'::text, 'check_in_reminder'::text, 'check_out_reminder'::text, 'cancellation'::text, 'payment'::text])),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on booking_notifications
ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Anyone can read booking_notifications" 
  ON public.booking_notifications FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert booking_notifications" 
  ON public.booking_notifications FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update booking_notifications" 
  ON public.booking_notifications FOR UPDATE 
  USING (true);

-- Trigger to update updated_at on reviews
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();