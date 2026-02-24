-- Align role/user-role RLS with granular permissions used by Roles & Permissions UI.
-- This fixes 42501 errors when users have new permissions (e.g. settings.roles_permissions)
-- but not legacy staff.manage.

-- ------------------------------
-- roles table policies
-- ------------------------------
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.roles;
DROP POLICY IF EXISTS "Users with staff.view can read roles" ON public.roles;
DROP POLICY IF EXISTS "Users with staff.manage can insert roles" ON public.roles;
DROP POLICY IF EXISTS "Users with staff.manage can update roles" ON public.roles;
DROP POLICY IF EXISTS "Users with role-management permissions can insert roles" ON public.roles;
DROP POLICY IF EXISTS "Users with role-management permissions can update roles" ON public.roles;
DROP POLICY IF EXISTS "Users with role-management permissions can delete roles" ON public.roles;

-- Keep roles readable to authenticated users (required for permission resolution UX).
CREATE POLICY "Authenticated users can read roles"
ON public.roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users with role-management permissions can insert roles"
ON public.roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_permission(auth.uid(), 'staff.manage')
  OR public.has_permission(auth.uid(), 'staff.manage_roles')
  OR public.has_permission(auth.uid(), 'settings.manage')
  OR public.has_permission(auth.uid(), 'settings.roles_permissions')
);

CREATE POLICY "Users with role-management permissions can update roles"
ON public.roles
FOR UPDATE
TO authenticated
USING (
  public.has_permission(auth.uid(), 'staff.manage')
  OR public.has_permission(auth.uid(), 'staff.manage_roles')
  OR public.has_permission(auth.uid(), 'settings.manage')
  OR public.has_permission(auth.uid(), 'settings.roles_permissions')
)
WITH CHECK (
  public.has_permission(auth.uid(), 'staff.manage')
  OR public.has_permission(auth.uid(), 'staff.manage_roles')
  OR public.has_permission(auth.uid(), 'settings.manage')
  OR public.has_permission(auth.uid(), 'settings.roles_permissions')
);

-- Prevent deleting system roles at the database layer as well.
CREATE POLICY "Users with role-management permissions can delete roles"
ON public.roles
FOR DELETE
TO authenticated
USING (
  COALESCE(is_system_role, false) = false
  AND (
    public.has_permission(auth.uid(), 'staff.manage')
    OR public.has_permission(auth.uid(), 'staff.manage_roles')
    OR public.has_permission(auth.uid(), 'settings.manage')
    OR public.has_permission(auth.uid(), 'settings.roles_permissions')
  )
);

-- ------------------------------
-- user_roles table policies
-- ------------------------------
DROP POLICY IF EXISTS "Authenticated users can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users with staff.manage can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users with staff.manage can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users with staff.manage can delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles or role managers" ON public.user_roles;
DROP POLICY IF EXISTS "Users with role-management permissions can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users with role-management permissions can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users with role-management permissions can delete user_roles" ON public.user_roles;

CREATE POLICY "Users can read their own roles or role managers"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_permission(auth.uid(), 'staff.manage')
  OR public.has_permission(auth.uid(), 'staff.manage_roles')
  OR public.has_permission(auth.uid(), 'settings.manage')
  OR public.has_permission(auth.uid(), 'settings.roles_permissions')
);

CREATE POLICY "Users with role-management permissions can insert user_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_permission(auth.uid(), 'staff.manage')
  OR public.has_permission(auth.uid(), 'staff.manage_roles')
  OR public.has_permission(auth.uid(), 'settings.manage')
  OR public.has_permission(auth.uid(), 'settings.roles_permissions')
);

CREATE POLICY "Users with role-management permissions can update user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_permission(auth.uid(), 'staff.manage')
  OR public.has_permission(auth.uid(), 'staff.manage_roles')
  OR public.has_permission(auth.uid(), 'settings.manage')
  OR public.has_permission(auth.uid(), 'settings.roles_permissions')
)
WITH CHECK (
  public.has_permission(auth.uid(), 'staff.manage')
  OR public.has_permission(auth.uid(), 'staff.manage_roles')
  OR public.has_permission(auth.uid(), 'settings.manage')
  OR public.has_permission(auth.uid(), 'settings.roles_permissions')
);

CREATE POLICY "Users with role-management permissions can delete user_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_permission(auth.uid(), 'staff.manage')
  OR public.has_permission(auth.uid(), 'staff.manage_roles')
  OR public.has_permission(auth.uid(), 'settings.manage')
  OR public.has_permission(auth.uid(), 'settings.roles_permissions')
);
