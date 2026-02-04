-- Staff leave requests and timesheets

CREATE TABLE IF NOT EXISTS public.staff_leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_leave_requests
  ADD CONSTRAINT staff_leave_requests_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS staff_leave_requests_staff_id_idx ON public.staff_leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS staff_leave_requests_status_idx ON public.staff_leave_requests(status);

CREATE TABLE IF NOT EXISTS public.staff_timesheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_timesheets
  ADD CONSTRAINT staff_timesheets_status_check
  CHECK (status IN ('submitted', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS staff_timesheets_staff_id_idx ON public.staff_timesheets(staff_id);
CREATE INDEX IF NOT EXISTS staff_timesheets_work_date_idx ON public.staff_timesheets(work_date);

ALTER TABLE public.staff_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read staff leave requests"
  ON public.staff_leave_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert staff leave requests"
  ON public.staff_leave_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update staff leave requests"
  ON public.staff_leave_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read staff timesheets"
  ON public.staff_timesheets FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert staff timesheets"
  ON public.staff_timesheets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update staff timesheets"
  ON public.staff_timesheets FOR UPDATE
  USING (true)
  WITH CHECK (true);
