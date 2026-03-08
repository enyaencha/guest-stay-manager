-- Add organization + branch multitenancy foundation for guest-stay-manager.
-- This mirrors the pharmacy model: tenant organization, branch properties, and member access context.

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug_unique
  ON public.organizations (LOWER(slug));

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_org_slug_unique
  ON public.properties (organization_id, LOWER(slug));

CREATE INDEX IF NOT EXISTS idx_properties_org_active
  ON public.properties (organization_id, is_active, is_primary, created_at);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  property_id UUID NULL REFERENCES public.properties(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'front_desk'::app_role,
  has_all_properties BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
  ON public.organization_members (user_id, is_active, is_default, created_at);

CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id
  ON public.organization_members (organization_id, is_active, created_at);

CREATE TABLE IF NOT EXISTS public.organization_member_properties (
  membership_id UUID NOT NULL REFERENCES public.organization_members(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (membership_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_member_properties_property_id
  ON public.organization_member_properties (property_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_member_properties ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_organization_id UUID NULL REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_property_id UUID NULL REFERENCES public.properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_current_organization_id
  ON public.profiles (current_organization_id);

CREATE INDEX IF NOT EXISTS idx_profiles_current_property_id
  ON public.profiles (current_property_id);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.normalize_slug_value(_value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(lower(BTRIM(COALESCE(_value, ''))), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)',
      '',
      'g'
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.is_organization_member(_user_id UUID, _organization_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members AS membership
    WHERE membership.user_id = _user_id
      AND membership.organization_id = _organization_id
      AND COALESCE(membership.is_active, true) = true
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_property_access(
  _user_id UUID,
  _organization_id UUID,
  _property_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members AS membership
    WHERE membership.user_id = _user_id
      AND membership.organization_id = _organization_id
      AND COALESCE(membership.is_active, true) = true
      AND (
        membership.has_all_properties = true
        OR membership.property_id = _property_id
        OR EXISTS (
          SELECT 1
          FROM public.organization_member_properties AS member_property
          WHERE member_property.membership_id = membership.id
            AND member_property.property_id = _property_id
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_organization_id()
RETURNS UUID
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_organization_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT profile.current_organization_id
  INTO selected_organization_id
  FROM public.profiles AS profile
  WHERE profile.user_id = auth.uid()
  LIMIT 1;

  IF selected_organization_id IS NOT NULL
     AND public.is_organization_member(auth.uid(), selected_organization_id) = true THEN
    RETURN selected_organization_id;
  END IF;

  SELECT membership.organization_id
  INTO selected_organization_id
  FROM public.organization_members AS membership
  WHERE membership.user_id = auth.uid()
    AND COALESCE(membership.is_active, true) = true
  ORDER BY
    COALESCE(membership.is_default, false) DESC,
    membership.created_at ASC
  LIMIT 1;

  RETURN selected_organization_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_property_id()
RETURNS UUID
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_organization_id UUID;
  selected_property_id UUID;
  default_property_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  current_organization_id := public.get_current_organization_id();
  IF current_organization_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT profile.current_property_id
  INTO selected_property_id
  FROM public.profiles AS profile
  WHERE profile.user_id = auth.uid()
  LIMIT 1;

  IF selected_property_id IS NOT NULL
     AND public.user_has_property_access(auth.uid(), current_organization_id, selected_property_id) = true THEN
    RETURN selected_property_id;
  END IF;

  SELECT membership.property_id
  INTO default_property_id
  FROM public.organization_members AS membership
  WHERE membership.user_id = auth.uid()
    AND membership.organization_id = current_organization_id
    AND COALESCE(membership.is_active, true) = true
  ORDER BY
    COALESCE(membership.is_default, false) DESC,
    membership.created_at ASC
  LIMIT 1;

  IF default_property_id IS NOT NULL
     AND public.user_has_property_access(auth.uid(), current_organization_id, default_property_id) = true THEN
    RETURN default_property_id;
  END IF;

  SELECT property.id
  INTO selected_property_id
  FROM public.properties AS property
  WHERE property.organization_id = current_organization_id
    AND COALESCE(property.is_active, true) = true
  ORDER BY
    COALESCE(property.is_primary, false) DESC,
    property.created_at ASC
  LIMIT 1;

  RETURN selected_property_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_current_property(_property_id UUID)
RETURNS TABLE (
  organization_id UUID,
  property_id UUID
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_property public.properties%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _property_id IS NULL THEN
    RAISE EXCEPTION 'Property is required';
  END IF;

  SELECT *
  INTO target_property
  FROM public.properties AS property
  WHERE property.id = _property_id
    AND COALESCE(property.is_active, true) = true
  LIMIT 1;

  IF target_property.id IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF public.user_has_property_access(auth.uid(), target_property.organization_id, target_property.id) <> true THEN
    RAISE EXCEPTION 'You do not have access to this branch';
  END IF;

  INSERT INTO public.profiles (
    user_id,
    current_organization_id,
    current_property_id
  )
  VALUES (
    auth.uid(),
    target_property.organization_id,
    target_property.id
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    current_organization_id = EXCLUDED.current_organization_id,
    current_property_id = EXCLUDED.current_property_id,
    updated_at = now();

  RETURN QUERY
  SELECT target_property.organization_id, target_property.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_tenant_context()
RETURNS TABLE (
  organization_id UUID,
  organization_slug TEXT,
  organization_name TEXT,
  membership_role app_role,
  has_all_properties BOOLEAN,
  property_id UUID,
  property_slug TEXT,
  property_name TEXT
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_organization_id UUID;
  current_property_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  current_organization_id := public.get_current_organization_id();
  current_property_id := public.get_current_property_id();

  IF current_organization_id IS NULL OR current_property_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    organization.id,
    organization.slug,
    organization.display_name,
    membership.role,
    COALESCE(membership.has_all_properties, true) AS has_all_properties,
    property.id,
    property.slug,
    property.display_name
  FROM public.organization_members AS membership
  JOIN public.organizations AS organization
    ON organization.id = membership.organization_id
  JOIN public.properties AS property
    ON property.id = current_property_id
   AND property.organization_id = organization.id
  WHERE membership.user_id = auth.uid()
    AND membership.organization_id = current_organization_id
    AND COALESCE(membership.is_active, true) = true
  ORDER BY
    COALESCE(membership.is_default, false) DESC,
    membership.created_at ASC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_accessible_properties()
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  slug TEXT,
  display_name TEXT,
  is_primary BOOLEAN,
  is_active BOOLEAN
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_organization_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  current_organization_id := public.get_current_organization_id();
  IF current_organization_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    property.id,
    property.organization_id,
    property.slug,
    property.display_name,
    COALESCE(property.is_primary, false) AS is_primary,
    COALESCE(property.is_active, true) AS is_active
  FROM public.properties AS property
  WHERE property.organization_id = current_organization_id
    AND COALESCE(property.is_active, true) = true
    AND public.user_has_property_access(auth.uid(), current_organization_id, property.id) = true
  ORDER BY
    COALESCE(property.is_primary, false) DESC,
    property.display_name ASC,
    property.created_at ASC;
END;
$$;

DO $$
DECLARE
  default_organization_id UUID;
  default_property_id UUID;
  organization_slug TEXT;
  organization_name TEXT;
  property_slug TEXT;
  property_name TEXT;
BEGIN
  SELECT organization.id
  INTO default_organization_id
  FROM public.organizations AS organization
  ORDER BY organization.created_at ASC
  LIMIT 1;

  IF default_organization_id IS NULL THEN
    SELECT
      COALESCE(public.normalize_slug_value(settings.name), 'default-organization'),
      COALESCE(NULLIF(BTRIM(settings.name), ''), 'Default Organization')
    INTO organization_slug, organization_name
    FROM public.property_settings AS settings
    ORDER BY settings.created_at ASC
    LIMIT 1;

    organization_slug := COALESCE(organization_slug, 'default-organization');
    organization_name := COALESCE(organization_name, 'Default Organization');

    INSERT INTO public.organizations (slug, display_name, is_active, created_by)
    VALUES (organization_slug, organization_name, true, NULL)
    ON CONFLICT (LOWER(slug)) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        is_active = true,
        updated_at = now()
    RETURNING id INTO default_organization_id;
  END IF;

  SELECT property.id
  INTO default_property_id
  FROM public.properties AS property
  WHERE property.organization_id = default_organization_id
  ORDER BY
    COALESCE(property.is_primary, false) DESC,
    property.created_at ASC
  LIMIT 1;

  IF default_property_id IS NULL THEN
    SELECT
      COALESCE(
        public.normalize_slug_value(settings.city),
        public.normalize_slug_value(settings.name),
        'main-branch'
      ),
      COALESCE(NULLIF(BTRIM(settings.name), ''), 'Main Branch')
    INTO property_slug, property_name
    FROM public.property_settings AS settings
    ORDER BY settings.created_at ASC
    LIMIT 1;

    property_slug := COALESCE(property_slug, 'main-branch');
    property_name := COALESCE(property_name, 'Main Branch');

    INSERT INTO public.properties (
      organization_id,
      slug,
      display_name,
      is_primary,
      is_active,
      created_by
    )
    VALUES (
      default_organization_id,
      property_slug,
      property_name,
      true,
      true,
      NULL
    )
    ON CONFLICT (organization_id, LOWER(slug)) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        is_primary = true,
        is_active = true,
        updated_at = now()
    RETURNING id INTO default_property_id;
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
  SELECT
    default_organization_id,
    default_property_id,
    profile.user_id,
    COALESCE(
      (
        SELECT
          CASE role_definition.name
            WHEN 'administrator' THEN 'administrator'::app_role
            WHEN 'manager' THEN 'manager'::app_role
            WHEN 'front_desk' THEN 'front_desk'::app_role
            WHEN 'housekeeping_supervisor' THEN 'housekeeping_supervisor'::app_role
            WHEN 'maintenance_staff' THEN 'maintenance_staff'::app_role
            WHEN 'pos_operator' THEN 'pos_operator'::app_role
            WHEN 'accountant' THEN 'accountant'::app_role
            ELSE 'front_desk'::app_role
          END
        FROM public.user_roles AS user_role
        JOIN public.roles AS role_definition
          ON role_definition.id = user_role.role_id
        WHERE user_role.user_id = profile.user_id
          AND COALESCE(user_role.is_active, true) = true
        ORDER BY user_role.created_at ASC
        LIMIT 1
      ),
      'manager'::app_role
    ) AS resolved_role,
    true,
    true,
    true,
    NULL
  FROM public.profiles AS profile
  WHERE profile.user_id IS NOT NULL
  ON CONFLICT (organization_id, user_id) DO UPDATE
  SET
    property_id = EXCLUDED.property_id,
    role = EXCLUDED.role,
    has_all_properties = true,
    is_default = true,
    is_active = true,
    updated_at = now();

  UPDATE public.profiles AS profile
  SET
    current_organization_id = COALESCE(profile.current_organization_id, membership.organization_id),
    current_property_id = COALESCE(profile.current_property_id, membership.property_id),
    updated_at = now()
  FROM (
    SELECT DISTINCT ON (organization_member.user_id)
      organization_member.user_id,
      organization_member.organization_id,
      organization_member.property_id
    FROM public.organization_members AS organization_member
    WHERE COALESCE(organization_member.is_active, true) = true
    ORDER BY
      organization_member.user_id,
      COALESCE(organization_member.is_default, false) DESC,
      organization_member.created_at ASC
  ) AS membership
  WHERE profile.user_id = membership.user_id
    AND (
      profile.current_organization_id IS NULL
      OR profile.current_property_id IS NULL
    );
END;
$$;

DO $$
DECLARE
  scoped_table TEXT;
  scoped_tables TEXT[] := ARRAY[
    'audit_logs',
    'booking_notifications',
    'bookings',
    'expenses',
    'finance_transactions',
    'guest_issues',
    'guest_uploads',
    'guests',
    'housekeeping_staff',
    'housekeeping_tasks',
    'inventory_items',
    'inventory_lots',
    'inventory_transactions',
    'maintenance_issues',
    'maintenance_staff',
    'pos_items',
    'pos_transactions',
    'property_settings',
    'refund_requests',
    'reservation_requests',
    'review_requests',
    'reviews',
    'room_assessments',
    'room_supplies',
    'room_types',
    'rooms',
    'staff',
    'staff_leave_requests',
    'staff_salaries',
    'staff_timesheets',
    'system_preferences'
  ];
BEGIN
  FOREACH scoped_table IN ARRAY scoped_tables
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE',
      scoped_table
    );

    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE',
      scoped_table
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%I_organization_id ON public.%I (organization_id)',
      scoped_table,
      scoped_table
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%I_property_id ON public.%I (property_id)',
      scoped_table,
      scoped_table
    );
  END LOOP;
END;
$$;

DO $$
DECLARE
  default_organization_id UUID;
  default_property_id UUID;
  scoped_table TEXT;
  scoped_tables TEXT[] := ARRAY[
    'audit_logs',
    'booking_notifications',
    'bookings',
    'expenses',
    'finance_transactions',
    'guest_issues',
    'guest_uploads',
    'guests',
    'housekeeping_staff',
    'housekeeping_tasks',
    'inventory_items',
    'inventory_lots',
    'inventory_transactions',
    'maintenance_issues',
    'maintenance_staff',
    'pos_items',
    'pos_transactions',
    'property_settings',
    'refund_requests',
    'reservation_requests',
    'review_requests',
    'reviews',
    'room_assessments',
    'room_supplies',
    'room_types',
    'rooms',
    'staff',
    'staff_leave_requests',
    'staff_salaries',
    'staff_timesheets',
    'system_preferences'
  ];
BEGIN
  SELECT organization.id
  INTO default_organization_id
  FROM public.organizations AS organization
  ORDER BY organization.created_at ASC
  LIMIT 1;

  SELECT property.id
  INTO default_property_id
  FROM public.properties AS property
  WHERE property.organization_id = default_organization_id
  ORDER BY
    COALESCE(property.is_primary, false) DESC,
    property.created_at ASC
  LIMIT 1;

  IF default_organization_id IS NULL OR default_property_id IS NULL THEN
    RAISE EXCEPTION 'Cannot backfill tenant columns without a default organization/property';
  END IF;

  FOREACH scoped_table IN ARRAY scoped_tables
  LOOP
    EXECUTE format(
      'UPDATE public.%I
       SET
         organization_id = COALESCE(organization_id, %L::uuid),
         property_id = COALESCE(property_id, %L::uuid)
       WHERE organization_id IS NULL OR property_id IS NULL',
      scoped_table,
      default_organization_id::TEXT,
      default_property_id::TEXT
    );
  END LOOP;
END;
$$;

ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_org_property_number_unique
  ON public.rooms (organization_id, property_id, LOWER(number));

ALTER TABLE public.room_types DROP CONSTRAINT IF EXISTS room_types_name_key;
ALTER TABLE public.room_types DROP CONSTRAINT IF EXISTS room_types_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_types_org_name_unique
  ON public.room_types (organization_id, LOWER(name));

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_types_org_code_unique
  ON public.room_types (organization_id, LOWER(code));

ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_org_sku_unique
  ON public.inventory_items (organization_id, LOWER(sku))
  WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_settings_property_unique
  ON public.property_settings (property_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_preferences_property_unique
  ON public.system_preferences (property_id);

DO $$
DECLARE
  scoped_table TEXT;
  scoped_tables TEXT[] := ARRAY[
    'audit_logs',
    'booking_notifications',
    'bookings',
    'expenses',
    'finance_transactions',
    'guest_issues',
    'guest_uploads',
    'guests',
    'housekeeping_staff',
    'housekeeping_tasks',
    'inventory_items',
    'inventory_lots',
    'inventory_transactions',
    'maintenance_issues',
    'maintenance_staff',
    'pos_items',
    'pos_transactions',
    'property_settings',
    'refund_requests',
    'reservation_requests',
    'review_requests',
    'reviews',
    'room_assessments',
    'room_supplies',
    'room_types',
    'rooms',
    'staff',
    'staff_leave_requests',
    'staff_salaries',
    'staff_timesheets',
    'system_preferences'
  ];
BEGIN
  FOREACH scoped_table IN ARRAY scoped_tables
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN organization_id SET NOT NULL',
      scoped_table
    );
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN property_id SET NOT NULL',
      scoped_table
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_current_scope_defaults()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_organization_id UUID;
  current_property_id UUID;
BEGIN
  current_organization_id := public.get_current_organization_id();
  current_property_id := public.get_current_property_id();

  IF current_organization_id IS NULL THEN
    SELECT organization.id
    INTO current_organization_id
    FROM public.organizations AS organization
    WHERE COALESCE(organization.is_active, true) = true
    ORDER BY organization.created_at ASC
    LIMIT 1;
  END IF;

  IF current_property_id IS NULL AND current_organization_id IS NOT NULL THEN
    SELECT property.id
    INTO current_property_id
    FROM public.properties AS property
    WHERE property.organization_id = current_organization_id
      AND COALESCE(property.is_active, true) = true
    ORDER BY
      COALESCE(property.is_primary, false) DESC,
      property.created_at ASC
    LIMIT 1;
  END IF;

  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := current_organization_id;
  END IF;

  IF NEW.property_id IS NULL THEN
    NEW.property_id := current_property_id;
  END IF;

  IF NEW.organization_id IS NULL OR NEW.property_id IS NULL THEN
    RAISE EXCEPTION 'No active organization/property context';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  scoped_table TEXT;
  scoped_tables TEXT[] := ARRAY[
    'audit_logs',
    'booking_notifications',
    'bookings',
    'expenses',
    'finance_transactions',
    'guest_issues',
    'guest_uploads',
    'guests',
    'housekeeping_staff',
    'housekeeping_tasks',
    'inventory_items',
    'inventory_lots',
    'inventory_transactions',
    'maintenance_issues',
    'maintenance_staff',
    'pos_items',
    'pos_transactions',
    'property_settings',
    'refund_requests',
    'reservation_requests',
    'review_requests',
    'reviews',
    'room_assessments',
    'room_supplies',
    'room_types',
    'rooms',
    'staff',
    'staff_leave_requests',
    'staff_salaries',
    'staff_timesheets',
    'system_preferences'
  ];
BEGIN
  FOREACH scoped_table IN ARRAY scoped_tables
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_current_scope_defaults_before_insert ON public.%I',
      scoped_table
    );
    EXECUTE format(
      'CREATE TRIGGER set_current_scope_defaults_before_insert
       BEFORE INSERT ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.apply_current_scope_defaults()',
      scoped_table
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_profile_tenant_membership()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_organization_id UUID;
  default_property_id UUID;
BEGIN
  SELECT organization.id
  INTO default_organization_id
  FROM public.organizations AS organization
  WHERE COALESCE(organization.is_active, true) = true
  ORDER BY organization.created_at ASC
  LIMIT 1;

  IF default_organization_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT property.id
  INTO default_property_id
  FROM public.properties AS property
  WHERE property.organization_id = default_organization_id
    AND COALESCE(property.is_active, true) = true
  ORDER BY
    COALESCE(property.is_primary, false) DESC,
    property.created_at ASC
  LIMIT 1;

  IF default_property_id IS NULL THEN
    RETURN NEW;
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
    default_organization_id,
    default_property_id,
    NEW.user_id,
    'front_desk'::app_role,
    true,
    true,
    true,
    NULL
  )
  ON CONFLICT (organization_id, user_id) DO UPDATE
  SET
    property_id = EXCLUDED.property_id,
    is_active = true,
    updated_at = now();

  IF NEW.current_organization_id IS NULL THEN
    NEW.current_organization_id := default_organization_id;
  END IF;

  IF NEW.current_property_id IS NULL THEN
    NEW.current_property_id := default_property_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS initialize_profile_tenant_membership ON public.profiles;
CREATE TRIGGER initialize_profile_tenant_membership
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_profile_tenant_membership();

DO $$
DECLARE
  scoped_table TEXT;
  scoped_tables TEXT[] := ARRAY[
    'audit_logs',
    'booking_notifications',
    'bookings',
    'expenses',
    'finance_transactions',
    'guest_issues',
    'guest_uploads',
    'guests',
    'housekeeping_staff',
    'housekeeping_tasks',
    'inventory_items',
    'inventory_lots',
    'inventory_transactions',
    'maintenance_issues',
    'maintenance_staff',
    'pos_items',
    'pos_transactions',
    'property_settings',
    'refund_requests',
    'reservation_requests',
    'review_requests',
    'reviews',
    'room_assessments',
    'room_supplies',
    'room_types',
    'rooms',
    'staff',
    'staff_leave_requests',
    'staff_salaries',
    'staff_timesheets',
    'system_preferences'
  ];
  policy_row RECORD;
BEGIN
  FOREACH scoped_table IN ARRAY scoped_tables
  LOOP
    FOR policy_row IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = scoped_table
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        policy_row.policyname,
        scoped_table
      );
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', scoped_table);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I
       FOR SELECT TO authenticated
       USING (
         public.is_organization_member(auth.uid(), organization_id)
         AND public.user_has_property_access(auth.uid(), organization_id, property_id)
       )',
      'tenant_select_' || scoped_table,
      scoped_table
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I
       FOR INSERT TO authenticated
       WITH CHECK (
         organization_id = public.get_current_organization_id()
         AND property_id = public.get_current_property_id()
         AND public.is_organization_member(auth.uid(), organization_id)
         AND public.user_has_property_access(auth.uid(), organization_id, property_id)
       )',
      'tenant_insert_' || scoped_table,
      scoped_table
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I
       FOR UPDATE TO authenticated
       USING (
         public.is_organization_member(auth.uid(), organization_id)
         AND public.user_has_property_access(auth.uid(), organization_id, property_id)
       )
       WITH CHECK (
         organization_id = public.get_current_organization_id()
         AND property_id = public.get_current_property_id()
         AND public.is_organization_member(auth.uid(), organization_id)
         AND public.user_has_property_access(auth.uid(), organization_id, property_id)
       )',
      'tenant_update_' || scoped_table,
      scoped_table
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I
       FOR DELETE TO authenticated
       USING (
         public.is_organization_member(auth.uid(), organization_id)
         AND public.user_has_property_access(auth.uid(), organization_id, property_id)
       )',
      'tenant_delete_' || scoped_table,
      scoped_table
    );
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS tenant_read_organizations ON public.organizations;
CREATE POLICY tenant_read_organizations
  ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_organization_member(auth.uid(), id));

DROP POLICY IF EXISTS tenant_read_properties ON public.properties;
CREATE POLICY tenant_read_properties
  ON public.properties
  FOR SELECT TO authenticated
  USING (
    public.is_organization_member(auth.uid(), organization_id)
    AND public.user_has_property_access(auth.uid(), organization_id, id)
  );

DROP POLICY IF EXISTS tenant_read_organization_members ON public.organization_members;
CREATE POLICY tenant_read_organization_members
  ON public.organization_members
  FOR SELECT TO authenticated
  USING (public.is_organization_member(auth.uid(), organization_id));

DROP POLICY IF EXISTS tenant_read_organization_member_properties ON public.organization_member_properties;
CREATE POLICY tenant_read_organization_member_properties
  ON public.organization_member_properties
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members AS membership
      WHERE membership.id = organization_member_properties.membership_id
        AND public.is_organization_member(auth.uid(), membership.organization_id)
    )
  );

DROP POLICY IF EXISTS public_read_primary_property_settings ON public.property_settings;
CREATE POLICY public_read_primary_property_settings
  ON public.property_settings
  FOR SELECT TO anon
  USING (
    property_id = (
      SELECT property.id
      FROM public.properties AS property
      JOIN public.organizations AS organization
        ON organization.id = property.organization_id
      WHERE COALESCE(organization.is_active, true) = true
        AND COALESCE(property.is_active, true) = true
      ORDER BY
        COALESCE(property.is_primary, false) DESC,
        organization.created_at ASC,
        property.created_at ASC
      LIMIT 1
    )
  );

DROP POLICY IF EXISTS users_can_view_all_profiles ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY users_can_view_profiles_in_organization
  ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.organization_members AS membership
      JOIN public.organization_members AS current_member
        ON current_member.organization_id = membership.organization_id
      WHERE membership.user_id = profiles.user_id
        AND current_member.user_id = auth.uid()
        AND COALESCE(membership.is_active, true) = true
        AND COALESCE(current_member.is_active, true) = true
    )
  );

DROP POLICY IF EXISTS users_can_update_own_profile ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY users_can_update_own_profile
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS users_can_insert_own_profile ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY users_can_insert_own_profile
  ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON FUNCTION public.normalize_slug_value(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_slug_value(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_organization_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_organization_member(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.user_has_property_access(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_property_access(UUID, UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_current_organization_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_organization_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_current_property_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_property_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_current_property(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_current_property(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_my_tenant_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_context() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.list_my_accessible_properties() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_accessible_properties() TO authenticated, service_role;
