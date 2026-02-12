-- Extend reviews workflow with detailed ratings, responses, and action links

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS room_number TEXT,
  ADD COLUMN IF NOT EXISTS cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS staff_rating INTEGER CHECK (staff_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS comfort_rating INTEGER CHECK (comfort_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS response TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_issue_id UUID REFERENCES public.maintenance_issues(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS housekeeping_task_id UUID REFERENCES public.housekeeping_tasks(id) ON DELETE SET NULL;

-- Allow authenticated staff to view all reviews (not just approved)
DROP POLICY IF EXISTS "Authenticated users can read reviews" ON public.reviews;
CREATE POLICY "Authenticated users can read reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

-- Track automated review requests (post-checkout prompts)
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_email TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'manual')) DEFAULT 'manual',
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read review_requests" ON public.review_requests;
DROP POLICY IF EXISTS "Authenticated users can insert review_requests" ON public.review_requests;
DROP POLICY IF EXISTS "Authenticated users can update review_requests" ON public.review_requests;

CREATE POLICY "Authenticated users can read review_requests"
  ON public.review_requests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert review_requests"
  ON public.review_requests FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update review_requests"
  ON public.review_requests FOR UPDATE TO authenticated
  USING (true);

CREATE TRIGGER update_review_requests_updated_at
  BEFORE UPDATE ON public.review_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_review_requests_booking_id ON public.review_requests(booking_id);

-- Notification setting for auto review requests
ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS review_requests BOOLEAN DEFAULT true;
