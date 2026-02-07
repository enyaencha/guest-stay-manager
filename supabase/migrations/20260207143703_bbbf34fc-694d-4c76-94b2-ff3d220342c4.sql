
-- 1. Add HR fields to staff table
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS agreed_hours numeric DEFAULT 40,
ADD COLUMN IF NOT EXISTS annual_leave_days integer DEFAULT 21,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS notes text;

-- 2. Add leave_type to staff_leave_requests
ALTER TABLE public.staff_leave_requests
ADD COLUMN IF NOT EXISTS leave_type text DEFAULT 'Annual Leave';

-- 3. Add break_minutes and activity_types to staff_timesheets
ALTER TABLE public.staff_timesheets
ADD COLUMN IF NOT EXISTS break_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS activity_types text[] DEFAULT '{}';

-- 4. Create staff_salaries table for payroll tracking
CREATE TABLE IF NOT EXISTS public.staff_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  month text NOT NULL, -- e.g. '2026-02'
  base_salary numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  bonuses numeric NOT NULL DEFAULT 0,
  net_salary numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending', -- pending, paid, overdue
  payment_date date,
  payment_method text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(staff_id, month)
);

-- Enable RLS on staff_salaries
ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;

-- RLS policies for staff_salaries
CREATE POLICY "Users with finance permission can read salaries"
ON public.staff_salaries FOR SELECT TO authenticated
USING (has_permission(auth.uid(), 'finance.view') OR has_permission(auth.uid(), 'finance.manage') OR has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with finance.manage can insert salaries"
ON public.staff_salaries FOR INSERT TO authenticated
WITH CHECK (has_permission(auth.uid(), 'finance.manage') OR has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with finance.manage can update salaries"
ON public.staff_salaries FOR UPDATE TO authenticated
USING (has_permission(auth.uid(), 'finance.manage') OR has_permission(auth.uid(), 'staff.manage'));

-- Create updated_at trigger for staff_salaries
CREATE TRIGGER update_staff_salaries_updated_at
BEFORE UPDATE ON public.staff_salaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
