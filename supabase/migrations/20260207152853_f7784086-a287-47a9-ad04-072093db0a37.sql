
-- Add granular action-level permissions to the enum
-- These must be committed before they can be used in subsequent migrations
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'housekeeping.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'maintenance.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'inventory.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'bookings.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'pos.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'refunds.create';
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'finance.create';
