
-- Fix chicken-and-egg: users must be able to read role definitions to load their own permissions
-- Role definitions (names, permissions list) are not sensitive data

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users with staff.view can read roles" ON public.roles;

-- Create a policy allowing all authenticated users to read roles
CREATE POLICY "Authenticated users can read roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);
