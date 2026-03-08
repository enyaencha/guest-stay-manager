-- Ensure there is at least one platform owner account for /platform console.
-- This marks an existing admin user as platform_owner in auth user metadata.

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT membership.user_id
  INTO target_user_id
  FROM public.organization_members AS membership
  WHERE membership.role = 'administrator'::app_role
    AND COALESCE(membership.is_active, true) = true
  ORDER BY COALESCE(membership.is_default, false) DESC, membership.created_at ASC
  LIMIT 1;

  IF target_user_id IS NULL THEN
    SELECT user_row.id
    INTO target_user_id
    FROM auth.users AS user_row
    ORDER BY user_row.created_at ASC
    LIMIT 1;
  END IF;

  IF target_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::JSONB)
        || jsonb_build_object('platform_owner', true),
      updated_at = now()
    WHERE id = target_user_id;
  END IF;
END $$;

