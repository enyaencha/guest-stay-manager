-- Drop the recursive trigger that causes "stack depth limit exceeded" 
-- on user_roles insert/update operations.
-- Staff expiry is already checked client-side via rpc('deactivate_expired_staff')
DROP TRIGGER IF EXISTS check_expired_staff_trigger ON public.user_roles;