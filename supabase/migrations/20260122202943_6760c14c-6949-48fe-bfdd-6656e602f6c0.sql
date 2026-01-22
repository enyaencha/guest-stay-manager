-- Create function to assign administrator role to first user
CREATE OR REPLACE FUNCTION public.assign_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_role_id UUID;
  user_count INT;
BEGIN
  -- Check if this is the first user (excluding the one being inserted)
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE id != NEW.id;
  
  -- If this is the first user, assign administrator role
  IF user_count = 0 THEN
    -- Get the administrator role id
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Administrator' LIMIT 1;
    
    -- If administrator role exists, assign it
    IF admin_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id, is_active)
      VALUES (NEW.id, admin_role_id, true)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after profile creation (which happens after user signup)
DROP TRIGGER IF EXISTS assign_admin_to_first_user ON public.profiles;
CREATE TRIGGER assign_admin_to_first_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_first_user_admin();