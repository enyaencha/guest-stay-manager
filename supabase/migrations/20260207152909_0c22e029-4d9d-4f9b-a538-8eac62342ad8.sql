
-- Seed existing roles with the new create permissions based on their current manage permissions
UPDATE public.roles SET permissions = array_cat(permissions, ARRAY['housekeeping.create','maintenance.create','inventory.create','bookings.create','pos.create','refunds.create','finance.create']::app_permission[])
WHERE name = 'Administrator' AND NOT ('housekeeping.create' = ANY(permissions));

UPDATE public.roles SET permissions = array_cat(permissions, ARRAY['housekeeping.create','maintenance.create','inventory.create','bookings.create','pos.create','refunds.create']::app_permission[])
WHERE name = 'Manager' AND NOT ('housekeeping.create' = ANY(permissions));

UPDATE public.roles SET permissions = array_cat(permissions, ARRAY['bookings.create','pos.create']::app_permission[])
WHERE name = 'Front Desk' AND NOT ('bookings.create' = ANY(permissions));

UPDATE public.roles SET permissions = array_cat(permissions, ARRAY['housekeeping.create','inventory.create']::app_permission[])
WHERE name = 'Housekeeping Supervisor' AND NOT ('housekeeping.create' = ANY(permissions));

UPDATE public.roles SET permissions = array_cat(permissions, ARRAY['maintenance.create']::app_permission[])
WHERE name = 'Maintenance Staff' AND NOT ('maintenance.create' = ANY(permissions));

UPDATE public.roles SET permissions = array_cat(permissions, ARRAY['pos.create']::app_permission[])
WHERE name = 'POS Operator' AND NOT ('pos.create' = ANY(permissions));

UPDATE public.roles SET permissions = array_cat(permissions, ARRAY['finance.create']::app_permission[])
WHERE name = 'Accountant' AND NOT ('finance.create' = ANY(permissions));
