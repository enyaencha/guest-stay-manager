-- Add organization-scoped custom roles and platform admin console RPCs.

CREATE TABLE IF NOT EXISTS public.organization_role_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_key TEXT NULL,
  base_role app_role NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  permissions TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_role_definitions_org_lower_name_unique
  ON public.organization_role_definitions (organization_id, LOWER(name));

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_role_definitions_org_role_key_unique
  ON public.organization_role_definitions (organization_id, role_key)
  WHERE role_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organization_role_definitions_organization_id
  ON public.organization_role_definitions (organization_id, is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS public.organization_member_role_assignments (
  membership_id UUID PRIMARY KEY REFERENCES public.organization_members(id) ON DELETE CASCADE,
  role_definition_id UUID NOT NULL REFERENCES public.organization_role_definitions(id) ON DELETE CASCADE,
  assigned_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_member_role_assignments_role_definition_id
  ON public.organization_member_role_assignments (role_definition_id);

ALTER TABLE public.organization_role_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_member_role_assignments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_organization_role_definitions_updated_at ON public.organization_role_definitions;
CREATE TRIGGER update_organization_role_definitions_updated_at
  BEFORE UPDATE ON public.organization_role_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_member_role_assignments_updated_at ON public.organization_member_role_assignments;
CREATE TRIGGER update_organization_member_role_assignments_updated_at
  BEFORE UPDATE ON public.organization_member_role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_base_role_seed_permissions(_base_role app_role)
RETURNS TEXT[]
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mapped_role_name TEXT;
  seeded_permissions TEXT[];
BEGIN
  mapped_role_name := CASE _base_role
    WHEN 'administrator' THEN 'administrator'
    WHEN 'manager' THEN 'manager'
    WHEN 'front_desk' THEN 'front desk'
    WHEN 'housekeeping_supervisor' THEN 'housekeeping supervisor'
    WHEN 'maintenance_staff' THEN 'maintenance staff'
    WHEN 'pos_operator' THEN 'pos operator'
    WHEN 'accountant' THEN 'accountant'
    ELSE NULL
  END;

  IF mapped_role_name IS NOT NULL THEN
    SELECT role.permissions::TEXT[]
    INTO seeded_permissions
    FROM public.roles AS role
    WHERE LOWER(role.name) = mapped_role_name
    ORDER BY COALESCE(role.is_system_role, false) DESC, role.created_at ASC
    LIMIT 1;
  END IF;

  IF seeded_permissions IS NOT NULL THEN
    RETURN seeded_permissions;
  END IF;

  IF _base_role = 'administrator' THEN
    SELECT COALESCE(
      ARRAY(
        SELECT enumlabel::TEXT
        FROM pg_enum AS value
        JOIN pg_type AS type
          ON type.oid = value.enumtypid
        WHERE type.typname = 'app_permission'
        ORDER BY value.enumsortorder
      ),
      '{}'::TEXT[]
    )
    INTO seeded_permissions;
    RETURN seeded_permissions;
  END IF;

  RETURN CASE _base_role
    WHEN 'manager' THEN ARRAY[
      'dashboard.view',
      'rooms.view',
      'guests.view',
      'bookings.view',
      'bookings.create',
      'housekeeping.view',
      'housekeeping.create',
      'maintenance.view',
      'maintenance.create',
      'inventory.view',
      'inventory.create',
      'pos.view',
      'pos.create',
      'finance.view',
      'reports.view',
      'refunds.view',
      'reviews.view',
      'staff.view',
      'settings.view',
      'settings.roles_permissions'
    ]::TEXT[]
    WHEN 'front_desk' THEN ARRAY[
      'dashboard.view',
      'rooms.view',
      'guests.view',
      'guests.add',
      'bookings.view',
      'bookings.create',
      'bookings.checkin',
      'bookings.checkout',
      'pos.view',
      'pos.create_sale',
      'refunds.view',
      'reviews.view'
    ]::TEXT[]
    WHEN 'housekeeping_supervisor' THEN ARRAY[
      'dashboard.view',
      'rooms.view',
      'housekeeping.view',
      'housekeeping.create',
      'housekeeping.assign',
      'housekeeping.complete',
      'inventory.view'
    ]::TEXT[]
    WHEN 'maintenance_staff' THEN ARRAY[
      'dashboard.view',
      'rooms.view',
      'maintenance.view',
      'maintenance.create',
      'maintenance.resolve',
      'inventory.view'
    ]::TEXT[]
    WHEN 'pos_operator' THEN ARRAY[
      'dashboard.view',
      'guests.view',
      'pos.view',
      'pos.create_sale',
      'pos.bill_to_room',
      'refunds.create'
    ]::TEXT[]
    WHEN 'accountant' THEN ARRAY[
      'dashboard.view',
      'finance.view',
      'finance.view_transactions',
      'finance.add_expense',
      'reports.view',
      'reports.export',
      'refunds.view',
      'refunds.approve'
    ]::TEXT[]
    ELSE '{}'::TEXT[]
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_default_organization_roles(_organization_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _organization_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.organization_role_definitions (
    organization_id,
    role_key,
    base_role,
    name,
    description,
    permissions,
    is_system_role,
    is_active
  )
  VALUES
    (
      _organization_id,
      'administrator',
      'administrator'::app_role,
      'Administrator',
      'Full organization control across operations, staff, finance, and settings.',
      public.get_base_role_seed_permissions('administrator'::app_role),
      true,
      true
    ),
    (
      _organization_id,
      'manager',
      'manager'::app_role,
      'Manager',
      'Operational oversight with broad management permissions.',
      public.get_base_role_seed_permissions('manager'::app_role),
      true,
      true
    ),
    (
      _organization_id,
      'front_desk',
      'front_desk'::app_role,
      'Front Desk',
      'Guest check-in, reservations, and day-to-day desk operations.',
      public.get_base_role_seed_permissions('front_desk'::app_role),
      true,
      true
    ),
    (
      _organization_id,
      'housekeeping_supervisor',
      'housekeeping_supervisor'::app_role,
      'Housekeeping Supervisor',
      'Manage room cleaning workflows and housekeeping staff assignments.',
      public.get_base_role_seed_permissions('housekeeping_supervisor'::app_role),
      true,
      true
    ),
    (
      _organization_id,
      'maintenance_staff',
      'maintenance_staff'::app_role,
      'Maintenance Staff',
      'Handle reported issues, repairs, and maintenance execution.',
      public.get_base_role_seed_permissions('maintenance_staff'::app_role),
      true,
      true
    ),
    (
      _organization_id,
      'pos_operator',
      'pos_operator'::app_role,
      'POS Operator',
      'Point of sale operations and room billing actions.',
      public.get_base_role_seed_permissions('pos_operator'::app_role),
      true,
      true
    ),
    (
      _organization_id,
      'accountant',
      'accountant'::app_role,
      'Accountant',
      'Finance, expenses, and refund approval responsibilities.',
      public.get_base_role_seed_permissions('accountant'::app_role),
      true,
      true
    )
  ON CONFLICT (organization_id, role_key)
    WHERE role_key IS NOT NULL
  DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    is_system_role = true,
    is_active = true,
    updated_at = now();
END;
$$;

DO $$
DECLARE
  organization_row RECORD;
BEGIN
  FOR organization_row IN
    SELECT id
    FROM public.organizations
  LOOP
    PERFORM public.seed_default_organization_roles(organization_row.id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.initialize_organization_default_roles()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_default_organization_roles(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS initialize_organization_default_roles ON public.organizations;
CREATE TRIGGER initialize_organization_default_roles
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_organization_default_roles();

CREATE OR REPLACE FUNCTION public.sync_organization_member_role_assignment()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role_definition_id UUID;
BEGIN
  PERFORM public.seed_default_organization_roles(NEW.organization_id);

  SELECT role_definition.id
  INTO target_role_definition_id
  FROM public.organization_role_definitions AS role_definition
  WHERE role_definition.organization_id = NEW.organization_id
    AND role_definition.role_key = NEW.role::TEXT
  LIMIT 1;

  IF target_role_definition_id IS NOT NULL THEN
    INSERT INTO public.organization_member_role_assignments (
      membership_id,
      role_definition_id,
      assigned_by
    )
    VALUES (
      NEW.id,
      target_role_definition_id,
      NULL
    )
    ON CONFLICT ON CONSTRAINT organization_member_role_assignments_pkey DO UPDATE
    SET
      role_definition_id = EXCLUDED.role_definition_id,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_organization_member_role_assignment_on_insert ON public.organization_members;
CREATE TRIGGER sync_organization_member_role_assignment_on_insert
  AFTER INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_organization_member_role_assignment();

DROP TRIGGER IF EXISTS sync_organization_member_role_assignment_on_role_update ON public.organization_members;
CREATE TRIGGER sync_organization_member_role_assignment_on_role_update
  AFTER UPDATE OF role ON public.organization_members
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.sync_organization_member_role_assignment();

INSERT INTO public.organization_member_role_assignments (
  membership_id,
  role_definition_id,
  assigned_by
)
SELECT
  membership.id,
  role_definition.id,
  NULL
FROM public.organization_members AS membership
JOIN public.organization_role_definitions AS role_definition
  ON role_definition.organization_id = membership.organization_id
 AND role_definition.role_key = membership.role::TEXT
LEFT JOIN public.organization_member_role_assignments AS assignment
  ON assignment.membership_id = membership.id
WHERE assignment.membership_id IS NULL
ON CONFLICT ON CONSTRAINT organization_member_role_assignments_pkey DO NOTHING;

CREATE OR REPLACE FUNCTION public.require_current_organization_admin()
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_organization_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  current_organization_id := public.get_current_organization_id();
  IF current_organization_id IS NULL THEN
    RAISE EXCEPTION 'No active organization selected';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members AS membership
    WHERE membership.user_id = auth.uid()
      AND membership.organization_id = current_organization_id
      AND membership.role = 'administrator'::app_role
      AND COALESCE(membership.is_active, true) = true
  ) THEN
    RAISE EXCEPTION 'Only organization administrators can manage custom roles';
  END IF;

  RETURN current_organization_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_organization_permission_state()
RETURNS TABLE (
  role_definition_id UUID,
  role_name TEXT,
  role_description TEXT,
  base_role app_role,
  permissions TEXT[]
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_membership AS (
    SELECT membership.*
    FROM public.organization_members AS membership
    WHERE membership.user_id = auth.uid()
      AND membership.organization_id = public.get_current_organization_id()
      AND COALESCE(membership.is_active, true) = true
    ORDER BY COALESCE(membership.is_default, false) DESC, membership.created_at ASC
    LIMIT 1
  )
  SELECT
    resolved_role.id AS role_definition_id,
    resolved_role.name AS role_name,
    resolved_role.description AS role_description,
    resolved_role.base_role,
    COALESCE(resolved_role.permissions, '{}'::TEXT[]) AS permissions
  FROM current_membership AS membership
  JOIN LATERAL (
    SELECT prioritized_role.id,
      prioritized_role.organization_id,
      prioritized_role.role_key,
      prioritized_role.base_role,
      prioritized_role.name,
      prioritized_role.description,
      prioritized_role.permissions,
      prioritized_role.is_system_role,
      prioritized_role.is_active,
      prioritized_role.created_by,
      prioritized_role.created_at,
      prioritized_role.updated_at
    FROM (
      SELECT role_definition.*, 1 AS priority
      FROM public.organization_member_role_assignments AS assignment
      JOIN public.organization_role_definitions AS role_definition
        ON role_definition.id = assignment.role_definition_id
      WHERE assignment.membership_id = membership.id

      UNION ALL

      SELECT role_definition.*, 2 AS priority
      FROM public.organization_role_definitions AS role_definition
      WHERE role_definition.organization_id = membership.organization_id
        AND role_definition.role_key = membership.role::TEXT
    ) AS prioritized_role
    ORDER BY prioritized_role.priority ASC
    LIMIT 1
  ) AS resolved_role ON true;
$$;

CREATE OR REPLACE FUNCTION public.list_current_organization_role_definitions()
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  role_key TEXT,
  base_role app_role,
  name TEXT,
  description TEXT,
  permissions TEXT[],
  is_system_role BOOLEAN,
  is_active BOOLEAN,
  member_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_organization_id UUID;
BEGIN
  current_organization_id := public.require_current_organization_admin();

  RETURN QUERY
  SELECT
    role_definition.id,
    role_definition.organization_id,
    role_definition.role_key,
    role_definition.base_role,
    role_definition.name,
    role_definition.description,
    COALESCE(role_definition.permissions, '{}'::TEXT[]) AS permissions,
    COALESCE(role_definition.is_system_role, false) AS is_system_role,
    COALESCE(role_definition.is_active, true) AS is_active,
    COUNT(assignment.membership_id) AS member_count,
    role_definition.created_at,
    role_definition.updated_at
  FROM public.organization_role_definitions AS role_definition
  LEFT JOIN public.organization_member_role_assignments AS assignment
    ON assignment.role_definition_id = role_definition.id
  WHERE role_definition.organization_id = current_organization_id
  GROUP BY role_definition.id
  ORDER BY
    COALESCE(role_definition.is_system_role, false) DESC,
    role_definition.base_role ASC,
    role_definition.name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_current_organization_role_definition(
  _role_definition_id UUID DEFAULT NULL,
  _name TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _base_role app_role DEFAULT NULL,
  _permissions TEXT[] DEFAULT '{}'::TEXT[],
  _is_active BOOLEAN DEFAULT true
)
RETURNS public.organization_role_definitions
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_organization_id UUID;
  existing_role_definition public.organization_role_definitions%ROWTYPE;
  resolved_base_role app_role;
  normalized_name TEXT;
  normalized_description TEXT;
  allowed_permissions TEXT[];
  normalized_permissions TEXT[];
  invalid_permissions TEXT[];
  saved_role_definition public.organization_role_definitions%ROWTYPE;
BEGIN
  current_organization_id := public.require_current_organization_admin();

  IF _role_definition_id IS NOT NULL THEN
    SELECT *
    INTO existing_role_definition
    FROM public.organization_role_definitions AS role_definition
    WHERE role_definition.id = _role_definition_id
      AND role_definition.organization_id = current_organization_id
    LIMIT 1;

    IF existing_role_definition.id IS NULL THEN
      RAISE EXCEPTION 'Custom role not found';
    END IF;

    IF COALESCE(existing_role_definition.is_system_role, false) = true THEN
      RAISE EXCEPTION 'System roles cannot be modified. Create a custom role instead.';
    END IF;
  END IF;

  normalized_name := NULLIF(BTRIM(COALESCE(_name, existing_role_definition.name, '')), '');
  IF normalized_name IS NULL THEN
    RAISE EXCEPTION 'Role name is required';
  END IF;

  resolved_base_role := COALESCE(existing_role_definition.base_role, _base_role);
  IF resolved_base_role IS NULL THEN
    RAISE EXCEPTION 'Base membership role is required';
  END IF;

  normalized_description := COALESCE(_description, existing_role_definition.description, '');

  SELECT role_definition.permissions
  INTO allowed_permissions
  FROM public.organization_role_definitions AS role_definition
  WHERE role_definition.organization_id = current_organization_id
    AND role_definition.role_key = resolved_base_role::TEXT
  LIMIT 1;

  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT trimmed_permission
      FROM (
        SELECT NULLIF(BTRIM(permission), '') AS trimmed_permission
        FROM unnest(COALESCE(_permissions, existing_role_definition.permissions, '{}'::TEXT[])) AS permission
      ) AS normalized
      WHERE trimmed_permission IS NOT NULL
      ORDER BY trimmed_permission
    ),
    '{}'::TEXT[]
  )
  INTO normalized_permissions;

  SELECT COALESCE(
    ARRAY(
      SELECT permission
      FROM unnest(normalized_permissions) AS permission
      WHERE NOT (permission = ANY (COALESCE(allowed_permissions, '{}'::TEXT[])))
      ORDER BY permission
    ),
    '{}'::TEXT[]
  )
  INTO invalid_permissions;

  IF COALESCE(array_length(invalid_permissions, 1), 0) > 0 THEN
    RAISE EXCEPTION
      'Permissions % are not allowed for the % base role',
      invalid_permissions::TEXT,
      resolved_base_role::TEXT;
  END IF;

  INSERT INTO public.organization_role_definitions (
    id,
    organization_id,
    role_key,
    base_role,
    name,
    description,
    permissions,
    is_system_role,
    is_active,
    created_by
  )
  VALUES (
    COALESCE(_role_definition_id, gen_random_uuid()),
    current_organization_id,
    NULL,
    resolved_base_role,
    normalized_name,
    normalized_description,
    normalized_permissions,
    false,
    COALESCE(_is_active, existing_role_definition.is_active, true),
    auth.uid()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING * INTO saved_role_definition;

  RETURN saved_role_definition;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_current_organization_member_role_assignments()
RETURNS TABLE (
  membership_id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  membership_role app_role,
  role_definition_id UUID,
  role_name TEXT,
  role_base_role app_role,
  is_membership_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_organization_id UUID;
BEGIN
  current_organization_id := public.require_current_organization_admin();

  RETURN QUERY
  SELECT
    membership.id AS membership_id,
    membership.user_id,
    COALESCE(profile.full_name, '') AS full_name,
    COALESCE(profile.email, '') AS email,
    membership.role AS membership_role,
    resolved_role.id AS role_definition_id,
    resolved_role.name AS role_name,
    resolved_role.base_role AS role_base_role,
    COALESCE(membership.is_active, true) AS is_membership_active,
    membership.created_at
  FROM public.organization_members AS membership
  LEFT JOIN public.profiles AS profile
    ON profile.user_id = membership.user_id
  JOIN LATERAL (
    SELECT prioritized_role.id,
      prioritized_role.organization_id,
      prioritized_role.role_key,
      prioritized_role.base_role,
      prioritized_role.name,
      prioritized_role.description,
      prioritized_role.permissions,
      prioritized_role.is_system_role,
      prioritized_role.is_active,
      prioritized_role.created_by,
      prioritized_role.created_at,
      prioritized_role.updated_at
    FROM (
      SELECT role_definition.*, 1 AS priority
      FROM public.organization_member_role_assignments AS assignment
      JOIN public.organization_role_definitions AS role_definition
        ON role_definition.id = assignment.role_definition_id
      WHERE assignment.membership_id = membership.id

      UNION ALL

      SELECT role_definition.*, 2 AS priority
      FROM public.organization_role_definitions AS role_definition
      WHERE role_definition.organization_id = membership.organization_id
        AND role_definition.role_key = membership.role::TEXT
    ) AS prioritized_role
    ORDER BY prioritized_role.priority ASC
    LIMIT 1
  ) AS resolved_role ON true
  WHERE membership.organization_id = current_organization_id
  ORDER BY
    COALESCE(membership.is_active, true) DESC,
    COALESCE(membership.is_default, false) DESC,
    COALESCE(profile.full_name, profile.email, membership.user_id::TEXT) ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_current_organization_member_role_definition(
  _membership_id UUID,
  _role_definition_id UUID
)
RETURNS TABLE (
  membership_id UUID,
  role_definition_id UUID,
  role_name TEXT,
  role_base_role app_role
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_organization_id UUID;
  target_membership public.organization_members%ROWTYPE;
  target_role_definition public.organization_role_definitions%ROWTYPE;
BEGIN
  current_organization_id := public.require_current_organization_admin();

  IF _membership_id IS NULL OR _role_definition_id IS NULL THEN
    RAISE EXCEPTION 'Membership and custom role are required';
  END IF;

  SELECT *
  INTO target_membership
  FROM public.organization_members AS membership
  WHERE membership.id = _membership_id
    AND membership.organization_id = current_organization_id
  LIMIT 1;

  IF target_membership.id IS NULL THEN
    RAISE EXCEPTION 'Organization member not found';
  END IF;

  SELECT *
  INTO target_role_definition
  FROM public.organization_role_definitions AS role_definition
  WHERE role_definition.id = _role_definition_id
    AND role_definition.organization_id = current_organization_id
    AND COALESCE(role_definition.is_active, true) = true
  LIMIT 1;

  IF target_role_definition.id IS NULL THEN
    RAISE EXCEPTION 'Selected custom role not found';
  END IF;

  IF target_role_definition.base_role <> target_membership.role THEN
    RAISE EXCEPTION
      'The selected custom role is for % members and cannot be assigned to a % member',
      target_role_definition.base_role,
      target_membership.role;
  END IF;

  INSERT INTO public.organization_member_role_assignments (
    membership_id,
    role_definition_id,
    assigned_by
  )
  VALUES (
    target_membership.id,
    target_role_definition.id,
    auth.uid()
  )
  ON CONFLICT ON CONSTRAINT organization_member_role_assignments_pkey DO UPDATE
  SET
    role_definition_id = EXCLUDED.role_definition_id,
    assigned_by = EXCLUDED.assigned_by,
    updated_at = now();

  RETURN QUERY
  SELECT
    target_membership.id,
    target_role_definition.id,
    target_role_definition.name,
    target_role_definition.base_role;
END;
$$;

DROP POLICY IF EXISTS tenant_read_organization_role_definitions ON public.organization_role_definitions;
CREATE POLICY tenant_read_organization_role_definitions
  ON public.organization_role_definitions
  FOR SELECT TO authenticated
  USING (public.is_organization_member(auth.uid(), organization_id));

DROP POLICY IF EXISTS tenant_manage_organization_role_definitions ON public.organization_role_definitions;
CREATE POLICY tenant_manage_organization_role_definitions
  ON public.organization_role_definitions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members AS membership
      WHERE membership.organization_id = organization_role_definitions.organization_id
        AND membership.user_id = auth.uid()
        AND membership.role = 'administrator'::app_role
        AND COALESCE(membership.is_active, true) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_members AS membership
      WHERE membership.organization_id = organization_role_definitions.organization_id
        AND membership.user_id = auth.uid()
        AND membership.role = 'administrator'::app_role
        AND COALESCE(membership.is_active, true) = true
    )
  );

DROP POLICY IF EXISTS tenant_read_organization_member_role_assignments ON public.organization_member_role_assignments;
CREATE POLICY tenant_read_organization_member_role_assignments
  ON public.organization_member_role_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members AS membership
      JOIN public.organization_role_definitions AS role_definition
        ON role_definition.id = organization_member_role_assignments.role_definition_id
      WHERE membership.id = organization_member_role_assignments.membership_id
        AND membership.organization_id = role_definition.organization_id
        AND public.is_organization_member(auth.uid(), membership.organization_id)
    )
  );

DROP POLICY IF EXISTS tenant_manage_organization_member_role_assignments ON public.organization_member_role_assignments;
CREATE POLICY tenant_manage_organization_member_role_assignments
  ON public.organization_member_role_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members AS membership
      JOIN public.organization_role_definitions AS role_definition
        ON role_definition.id = organization_member_role_assignments.role_definition_id
      JOIN public.organization_members AS current_membership
        ON current_membership.organization_id = membership.organization_id
      WHERE membership.id = organization_member_role_assignments.membership_id
        AND current_membership.user_id = auth.uid()
        AND current_membership.role = 'administrator'::app_role
        AND COALESCE(current_membership.is_active, true) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_members AS membership
      JOIN public.organization_role_definitions AS role_definition
        ON role_definition.id = organization_member_role_assignments.role_definition_id
      JOIN public.organization_members AS current_membership
        ON current_membership.organization_id = membership.organization_id
      WHERE membership.id = organization_member_role_assignments.membership_id
        AND current_membership.user_id = auth.uid()
        AND current_membership.role = 'administrator'::app_role
        AND COALESCE(current_membership.is_active, true) = true
    )
  );

CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TEXT[]
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_organization_id UUID;
  resolved_permissions TEXT[];
BEGIN
  IF _user_id IS NULL THEN
    RETURN '{}'::TEXT[];
  END IF;

  SELECT profile.current_organization_id
  INTO selected_organization_id
  FROM public.profiles AS profile
  WHERE profile.user_id = _user_id
  LIMIT 1;

  IF selected_organization_id IS NULL THEN
    SELECT membership.organization_id
    INTO selected_organization_id
    FROM public.organization_members AS membership
    WHERE membership.user_id = _user_id
      AND COALESCE(membership.is_active, true) = true
    ORDER BY COALESCE(membership.is_default, false) DESC, membership.created_at ASC
    LIMIT 1;
  END IF;

  IF selected_organization_id IS NOT NULL THEN
    SELECT COALESCE(resolved_role.permissions, '{}'::TEXT[])
    INTO resolved_permissions
    FROM public.organization_members AS membership
    JOIN LATERAL (
      SELECT prioritized_role.permissions
      FROM (
        SELECT role_definition.permissions, 1 AS priority
        FROM public.organization_member_role_assignments AS assignment
        JOIN public.organization_role_definitions AS role_definition
          ON role_definition.id = assignment.role_definition_id
        WHERE assignment.membership_id = membership.id

        UNION ALL

        SELECT role_definition.permissions, 2 AS priority
        FROM public.organization_role_definitions AS role_definition
        WHERE role_definition.organization_id = membership.organization_id
          AND role_definition.role_key = membership.role::TEXT
      ) AS prioritized_role
      ORDER BY prioritized_role.priority ASC
      LIMIT 1
    ) AS resolved_role ON true
    WHERE membership.user_id = _user_id
      AND membership.organization_id = selected_organization_id
      AND COALESCE(membership.is_active, true) = true
    ORDER BY COALESCE(membership.is_default, false) DESC, membership.created_at ASC
    LIMIT 1;
  END IF;

  IF COALESCE(array_length(resolved_permissions, 1), 0) > 0 THEN
    RETURN resolved_permissions;
  END IF;

  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT permission
      FROM (
        SELECT UNNEST(role.permissions::TEXT[]) AS permission
        FROM public.user_roles AS user_role
        JOIN public.roles AS role
          ON role.id = user_role.role_id
        WHERE user_role.user_id = _user_id
          AND COALESCE(user_role.is_active, true) = true
          AND (user_role.valid_until IS NULL OR user_role.valid_until > now())
      ) AS permissions
      ORDER BY permission
    ),
    '{}'::TEXT[]
  )
  INTO resolved_permissions;

  RETURN COALESCE(resolved_permissions, '{}'::TEXT[]);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _permission = ANY(public.get_user_permissions(_user_id));
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_name TEXT)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_role_name TEXT;
  selected_organization_id UUID;
BEGIN
  IF _user_id IS NULL OR _role_name IS NULL THEN
    RETURN false;
  END IF;

  normalized_role_name := LOWER(replace(replace(BTRIM(_role_name), ' ', '_'), '-', '_'));

  SELECT profile.current_organization_id
  INTO selected_organization_id
  FROM public.profiles AS profile
  WHERE profile.user_id = _user_id
  LIMIT 1;

  IF selected_organization_id IS NULL THEN
    SELECT membership.organization_id
    INTO selected_organization_id
    FROM public.organization_members AS membership
    WHERE membership.user_id = _user_id
      AND COALESCE(membership.is_active, true) = true
    ORDER BY COALESCE(membership.is_default, false) DESC, membership.created_at ASC
    LIMIT 1;
  END IF;

  IF selected_organization_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.organization_members AS membership
      LEFT JOIN public.organization_member_role_assignments AS assignment
        ON assignment.membership_id = membership.id
      LEFT JOIN public.organization_role_definitions AS role_definition
        ON role_definition.id = assignment.role_definition_id
      WHERE membership.user_id = _user_id
        AND membership.organization_id = selected_organization_id
        AND COALESCE(membership.is_active, true) = true
        AND (
          LOWER(membership.role::TEXT) = normalized_role_name
          OR LOWER(COALESCE(role_definition.role_key, '')) = normalized_role_name
          OR LOWER(COALESCE(role_definition.name, '')) = LOWER(BTRIM(_role_name))
        )
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles AS user_role
    JOIN public.roles AS role
      ON role.id = user_role.role_id
    WHERE user_role.user_id = _user_id
      AND COALESCE(user_role.is_active, true) = true
      AND (user_role.valid_until IS NULL OR user_role.valid_until > now())
      AND LOWER(role.name) = LOWER(BTRIM(_role_name))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role_name TEXT, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, _role_name);
$$;

CREATE OR REPLACE FUNCTION public.is_platform_owner(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users AS user_row
    WHERE user_row.id = _user_id
      AND (
        COALESCE((user_row.raw_user_meta_data ->> 'platform_owner')::BOOLEAN, false) = true
        OR LOWER(COALESCE(user_row.email, '')) = 'admin@platform.local'
      )
  )
  OR public.has_role(_user_id, 'administrator')
  OR public.has_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.require_platform_owner()
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF public.is_platform_owner(auth.uid()) <> true THEN
    RAISE EXCEPTION 'Platform owner access required';
  END IF;

  RETURN auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.list_platform_organizations()
RETURNS TABLE (
  id UUID,
  slug TEXT,
  display_name TEXT,
  is_active BOOLEAN,
  property_count BIGINT,
  member_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.require_platform_owner();

  RETURN QUERY
  SELECT
    organization.id,
    organization.slug,
    organization.display_name,
    COALESCE(organization.is_active, true) AS is_active,
    COUNT(DISTINCT property.id) AS property_count,
    COUNT(DISTINCT membership.id) AS member_count,
    organization.created_at,
    organization.updated_at
  FROM public.organizations AS organization
  LEFT JOIN public.properties AS property
    ON property.organization_id = organization.id
  LEFT JOIN public.organization_members AS membership
    ON membership.organization_id = organization.id
  GROUP BY organization.id
  ORDER BY organization.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_platform_organization_properties(_organization_id UUID)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  slug TEXT,
  display_name TEXT,
  is_primary BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.require_platform_owner();

  IF _organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization is required';
  END IF;

  RETURN QUERY
  SELECT
    property.id,
    property.organization_id,
    property.slug,
    property.display_name,
    COALESCE(property.is_primary, false) AS is_primary,
    COALESCE(property.is_active, true) AS is_active,
    property.created_at,
    property.updated_at
  FROM public.properties AS property
  WHERE property.organization_id = _organization_id
  ORDER BY
    COALESCE(property.is_primary, false) DESC,
    property.display_name ASC,
    property.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_platform_organization_members(_organization_id UUID)
RETURNS TABLE (
  membership_id UUID,
  organization_id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  base_role app_role,
  property_id UUID,
  property_name TEXT,
  is_active BOOLEAN,
  has_all_properties BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.require_platform_owner();

  IF _organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization is required';
  END IF;

  RETURN QUERY
  SELECT
    membership.id AS membership_id,
    membership.organization_id,
    membership.user_id,
    COALESCE(profile.full_name, '') AS full_name,
    COALESCE(profile.email, '') AS email,
    membership.role AS base_role,
    membership.property_id,
    COALESCE(property.display_name, '') AS property_name,
    COALESCE(membership.is_active, true) AS is_active,
    COALESCE(membership.has_all_properties, true) AS has_all_properties,
    membership.created_at
  FROM public.organization_members AS membership
  LEFT JOIN public.profiles AS profile
    ON profile.user_id = membership.user_id
  LEFT JOIN public.properties AS property
    ON property.id = membership.property_id
  WHERE membership.organization_id = _organization_id
  ORDER BY
    COALESCE(membership.is_active, true) DESC,
    COALESCE(profile.full_name, profile.email, membership.user_id::TEXT) ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_platform_organization(
  _organization_id UUID DEFAULT NULL,
  _slug TEXT DEFAULT NULL,
  _display_name TEXT DEFAULT NULL,
  _is_active BOOLEAN DEFAULT true,
  _primary_property_slug TEXT DEFAULT 'main-branch',
  _primary_property_name TEXT DEFAULT 'Main Branch'
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_slug TEXT;
  resolved_display_name TEXT;
  saved_organization_id UUID;
BEGIN
  PERFORM public.require_platform_owner();

  resolved_slug := public.normalize_slug_value(_slug);
  IF resolved_slug IS NULL THEN
    RAISE EXCEPTION 'Organization slug is required';
  END IF;

  resolved_display_name := NULLIF(BTRIM(COALESCE(_display_name, '')), '');
  IF resolved_display_name IS NULL THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  INSERT INTO public.organizations (
    id,
    slug,
    display_name,
    is_active,
    created_by
  )
  VALUES (
    COALESCE(_organization_id, gen_random_uuid()),
    resolved_slug,
    resolved_display_name,
    COALESCE(_is_active, true),
    auth.uid()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    slug = EXCLUDED.slug,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING id INTO saved_organization_id;

  INSERT INTO public.properties (
    organization_id,
    slug,
    display_name,
    is_primary,
    is_active,
    created_by
  )
  VALUES (
    saved_organization_id,
    COALESCE(public.normalize_slug_value(_primary_property_slug), 'main-branch'),
    COALESCE(NULLIF(BTRIM(_primary_property_name), ''), 'Main Branch'),
    true,
    true,
    auth.uid()
  )
  ON CONFLICT (organization_id, LOWER(slug)) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    is_primary = true,
    is_active = true,
    updated_at = now();

  PERFORM public.seed_default_organization_roles(saved_organization_id);

  RETURN saved_organization_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_platform_property(
  _organization_id UUID,
  _property_id UUID DEFAULT NULL,
  _slug TEXT DEFAULT NULL,
  _display_name TEXT DEFAULT NULL,
  _is_primary BOOLEAN DEFAULT false,
  _is_active BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_slug TEXT;
  resolved_display_name TEXT;
  saved_property_id UUID;
BEGIN
  PERFORM public.require_platform_owner();

  IF _organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organizations AS organization
    WHERE organization.id = _organization_id
  ) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  resolved_slug := public.normalize_slug_value(_slug);
  IF resolved_slug IS NULL THEN
    RAISE EXCEPTION 'Property slug is required';
  END IF;

  resolved_display_name := NULLIF(BTRIM(COALESCE(_display_name, '')), '');
  IF resolved_display_name IS NULL THEN
    RAISE EXCEPTION 'Property name is required';
  END IF;

  IF COALESCE(_is_primary, false) = true THEN
    UPDATE public.properties
    SET is_primary = false,
        updated_at = now()
    WHERE organization_id = _organization_id;
  END IF;

  INSERT INTO public.properties (
    id,
    organization_id,
    slug,
    display_name,
    is_primary,
    is_active,
    created_by
  )
  VALUES (
    COALESCE(_property_id, gen_random_uuid()),
    _organization_id,
    resolved_slug,
    resolved_display_name,
    COALESCE(_is_primary, false),
    COALESCE(_is_active, true),
    auth.uid()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    slug = EXCLUDED.slug,
    display_name = EXCLUDED.display_name,
    is_primary = EXCLUDED.is_primary,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING id INTO saved_property_id;

  RETURN saved_property_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_platform_organization_member(
  _organization_id UUID,
  _user_email TEXT,
  _base_role app_role DEFAULT 'front_desk'::app_role,
  _property_id UUID DEFAULT NULL,
  _has_all_properties BOOLEAN DEFAULT true,
  _is_active BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  target_property_id UUID;
  saved_membership_id UUID;
BEGIN
  PERFORM public.require_platform_owner();

  IF _organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization is required';
  END IF;

  IF _user_email IS NULL OR BTRIM(_user_email) = '' THEN
    RAISE EXCEPTION 'User email is required';
  END IF;

  SELECT user_row.id
  INTO target_user_id
  FROM auth.users AS user_row
  WHERE LOWER(user_row.email) = LOWER(BTRIM(_user_email))
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Create the auth user first.', _user_email;
  END IF;

  IF _property_id IS NOT NULL THEN
    SELECT property.id
    INTO target_property_id
    FROM public.properties AS property
    WHERE property.id = _property_id
      AND property.organization_id = _organization_id
    LIMIT 1;
  ELSE
    SELECT property.id
    INTO target_property_id
    FROM public.properties AS property
    WHERE property.organization_id = _organization_id
    ORDER BY COALESCE(property.is_primary, false) DESC, property.created_at ASC
    LIMIT 1;
  END IF;

  IF target_property_id IS NULL THEN
    RAISE EXCEPTION 'Property not found for this organization';
  END IF;

  INSERT INTO public.organization_members (
    organization_id,
    property_id,
    user_id,
    role,
    has_all_properties,
    is_default,
    is_active,
    created_by
  )
  VALUES (
    _organization_id,
    target_property_id,
    target_user_id,
    COALESCE(_base_role, 'front_desk'::app_role),
    COALESCE(_has_all_properties, true),
    true,
    COALESCE(_is_active, true),
    auth.uid()
  )
  ON CONFLICT (organization_id, user_id) DO UPDATE
  SET
    property_id = EXCLUDED.property_id,
    role = EXCLUDED.role,
    has_all_properties = EXCLUDED.has_all_properties,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING id INTO saved_membership_id;

  INSERT INTO public.organization_member_properties (
    membership_id,
    property_id
  )
  VALUES (
    saved_membership_id,
    target_property_id
  )
  ON CONFLICT (membership_id, property_id) DO NOTHING;

  RETURN saved_membership_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_base_role_seed_permissions(app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_base_role_seed_permissions(app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.seed_default_organization_roles(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_default_organization_roles(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.initialize_organization_default_roles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initialize_organization_default_roles() TO service_role;

REVOKE ALL ON FUNCTION public.sync_organization_member_role_assignment() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_organization_member_role_assignment() TO service_role;

REVOKE ALL ON FUNCTION public.require_current_organization_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.require_current_organization_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_my_organization_permission_state() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_organization_permission_state() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.list_current_organization_role_definitions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_current_organization_role_definitions() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.save_current_organization_role_definition(UUID, TEXT, TEXT, app_role, TEXT[], BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_current_organization_role_definition(UUID, TEXT, TEXT, app_role, TEXT[], BOOLEAN) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.list_current_organization_member_role_assignments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_current_organization_member_role_assignments() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.assign_current_organization_member_role_definition(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_current_organization_member_role_definition(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_permissions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_permission(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(TEXT, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_platform_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_owner(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.require_platform_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.require_platform_owner() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.list_platform_organizations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_platform_organizations() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.list_platform_organization_properties(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_platform_organization_properties(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.list_platform_organization_members(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_platform_organization_members(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.save_platform_organization(UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_platform_organization(UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.save_platform_property(UUID, UUID, TEXT, TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_platform_property(UUID, UUID, TEXT, TEXT, BOOLEAN, BOOLEAN) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.save_platform_organization_member(UUID, TEXT, app_role, UUID, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_platform_organization_member(UUID, TEXT, app_role, UUID, BOOLEAN, BOOLEAN) TO authenticated, service_role;

