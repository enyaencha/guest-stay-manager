-- Add employment_type to staff table (permanent or temporary)
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS employment_type TEXT NOT NULL DEFAULT 'permanent' CHECK (employment_type IN ('permanent', 'temporary'));

-- Add contract_end_date for temporary employees
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS contract_end_date DATE;

-- Create a function to automatically deactivate temporary staff when their contract ends
CREATE OR REPLACE FUNCTION public.deactivate_expired_staff()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deactivate staff whose contract has ended
  UPDATE public.staff
  SET status = 'inactive', updated_at = now()
  WHERE employment_type = 'temporary'
    AND contract_end_date IS NOT NULL
    AND contract_end_date < CURRENT_DATE
    AND status = 'active';
    
  -- Also deactivate their user roles
  UPDATE public.user_roles ur
  SET is_active = false, updated_at = now()
  FROM public.staff s
  WHERE ur.user_id = s.user_id
    AND s.employment_type = 'temporary'
    AND s.contract_end_date IS NOT NULL
    AND s.contract_end_date < CURRENT_DATE
    AND ur.is_active = true;
END;
$$;

-- Create a scheduled trigger using pg_cron alternative (using a trigger on any table access)
-- Since we can't use pg_cron directly, we'll create a function that checks on each login/access
CREATE OR REPLACE FUNCTION public.check_staff_expiry_on_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Run the deactivation check
  PERFORM public.deactivate_expired_staff();
  RETURN NEW;
END;
$$;

-- Create trigger to run expiry check when user_roles is accessed
DROP TRIGGER IF EXISTS check_expired_staff_trigger ON public.user_roles;
CREATE TRIGGER check_expired_staff_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.check_staff_expiry_on_access();