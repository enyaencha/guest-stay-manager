-- ==========================================
-- COMPREHENSIVE DATABASE SCHEMA FOR HOTEL MANAGEMENT SYSTEM
-- ==========================================

-- Create app role enum for user roles
CREATE TYPE public.app_role AS ENUM ('administrator', 'manager', 'front_desk', 'housekeeping_supervisor', 'maintenance_staff', 'pos_operator', 'accountant');

-- Create permission enum
CREATE TYPE public.app_permission AS ENUM (
  'rooms.view', 'rooms.manage',
  'guests.view', 'guests.manage',
  'bookings.view', 'bookings.manage',
  'housekeeping.view', 'housekeeping.manage',
  'maintenance.view', 'maintenance.manage',
  'inventory.view', 'inventory.manage',
  'pos.view', 'pos.manage',
  'finance.view', 'finance.manage',
  'reports.view', 'reports.export',
  'settings.view', 'settings.manage',
  'refunds.view', 'refunds.approve',
  'staff.view', 'staff.manage'
);

-- ==========================================
-- ROLES TABLE - Define available roles with permissions
-- ==========================================
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions app_permission[] NOT NULL DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roles"
  ON public.roles FOR SELECT
  USING (true);

-- ==========================================
-- USER_ROLES TABLE - Assign roles to users with optional expiration
-- ==========================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE, -- NULL means permanent
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read user_roles"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert user_roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update user_roles"
  ON public.user_roles FOR UPDATE
  USING (true);

-- ==========================================
-- STAFF TABLE - Staff members
-- ==========================================
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- Link to auth.users if they have system access
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read staff"
  ON public.staff FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert staff"
  ON public.staff FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update staff"
  ON public.staff FOR UPDATE
  USING (true);

-- ==========================================
-- ROOM_TYPES TABLE - Room type configurations
-- ==========================================
CREATE TABLE public.room_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  base_price NUMERIC NOT NULL,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  amenities TEXT[] DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read room_types"
  ON public.room_types FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert room_types"
  ON public.room_types FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update room_types"
  ON public.room_types FOR UPDATE
  USING (true);

-- ==========================================
-- ROOMS TABLE - Individual rooms
-- ==========================================
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  room_type_id UUID REFERENCES public.room_types(id),
  floor INTEGER NOT NULL DEFAULT 0,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  occupancy_status TEXT NOT NULL DEFAULT 'vacant' CHECK (occupancy_status IN ('vacant', 'occupied', 'checkout', 'reserved')),
  cleaning_status TEXT NOT NULL DEFAULT 'clean' CHECK (cleaning_status IN ('clean', 'dirty', 'in-progress', 'inspecting')),
  maintenance_status TEXT NOT NULL DEFAULT 'none' CHECK (maintenance_status IN ('none', 'pending', 'in-progress')),
  base_price NUMERIC NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  current_guest_id UUID REFERENCES public.guests(id),
  current_booking_id UUID REFERENCES public.bookings(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms"
  ON public.rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rooms"
  ON public.rooms FOR UPDATE
  USING (true);

-- ==========================================
-- HOUSEKEEPING_STAFF TABLE
-- ==========================================
CREATE TABLE public.housekeeping_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id),
  name TEXT NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_assigned INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  specialty TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.housekeeping_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read housekeeping_staff"
  ON public.housekeeping_staff FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert housekeeping_staff"
  ON public.housekeeping_staff FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update housekeeping_staff"
  ON public.housekeeping_staff FOR UPDATE
  USING (true);

-- ==========================================
-- HOUSEKEEPING_TASKS TABLE
-- ==========================================
CREATE TABLE public.housekeeping_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id),
  room_number TEXT NOT NULL,
  room_name TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('daily-clean', 'checkout-clean', 'deep-clean', 'turndown', 'inspection')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES public.housekeeping_staff(id),
  assigned_to_name TEXT,
  notes TEXT,
  amenities JSONB DEFAULT '[]',
  restock_notes TEXT,
  actual_added JSONB DEFAULT '[]',
  actual_added_notes TEXT,
  estimated_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read housekeeping_tasks"
  ON public.housekeeping_tasks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert housekeeping_tasks"
  ON public.housekeeping_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update housekeeping_tasks"
  ON public.housekeeping_tasks FOR UPDATE
  USING (true);

-- ==========================================
-- MAINTENANCE_STAFF TABLE
-- ==========================================
CREATE TABLE public.maintenance_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id),
  name TEXT NOT NULL,
  specialty TEXT[] DEFAULT '{}',
  issues_resolved INTEGER DEFAULT 0,
  issues_assigned INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance_staff"
  ON public.maintenance_staff FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance_staff"
  ON public.maintenance_staff FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance_staff"
  ON public.maintenance_staff FOR UPDATE
  USING (true);

-- ==========================================
-- MAINTENANCE_ISSUES TABLE
-- ==========================================
CREATE TABLE public.maintenance_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id),
  room_number TEXT NOT NULL,
  room_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('hvac', 'plumbing', 'electrical', 'appliance', 'structural', 'furniture', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'cancelled')),
  assigned_to UUID REFERENCES public.maintenance_staff(id),
  assigned_to_name TEXT,
  reported_by UUID REFERENCES public.staff(id),
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read maintenance_issues"
  ON public.maintenance_issues FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance_issues"
  ON public.maintenance_issues FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance_issues"
  ON public.maintenance_issues FOR UPDATE
  USING (true);

-- ==========================================
-- INVENTORY_ITEMS TABLE
-- ==========================================
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('amenities', 'bathroom', 'kitchen', 'cleaning', 'linen', 'office', 'other')),
  sku TEXT UNIQUE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  max_stock INTEGER NOT NULL DEFAULT 100,
  unit TEXT NOT NULL DEFAULT 'pieces',
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  supplier TEXT,
  last_restocked TIMESTAMP WITH TIME ZONE,
  opening_stock INTEGER DEFAULT 0,
  purchases_in INTEGER DEFAULT 0,
  stock_out INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read inventory_items"
  ON public.inventory_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert inventory_items"
  ON public.inventory_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory_items"
  ON public.inventory_items FOR UPDATE
  USING (true);

-- ==========================================
-- POS_ITEMS TABLE
-- ==========================================
CREATE TABLE public.pos_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('beverages', 'food', 'amenities', 'health', 'services', 'other')),
  price NUMERIC NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  stock_quantity INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pos_items"
  ON public.pos_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert pos_items"
  ON public.pos_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pos_items"
  ON public.pos_items FOR UPDATE
  USING (true);

-- ==========================================
-- POS_TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE public.pos_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT,
  guest_id UUID REFERENCES public.guests(id),
  guest_name TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'card', 'room-charge')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  staff_id UUID REFERENCES public.staff(id),
  staff_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pos_transactions"
  ON public.pos_transactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert pos_transactions"
  ON public.pos_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pos_transactions"
  ON public.pos_transactions FOR UPDATE
  USING (true);

-- ==========================================
-- FINANCE_TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE public.finance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT,
  reference TEXT,
  room_number TEXT,
  booking_id UUID REFERENCES public.bookings(id),
  vendor TEXT,
  created_by UUID REFERENCES public.staff(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read finance_transactions"
  ON public.finance_transactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert finance_transactions"
  ON public.finance_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update finance_transactions"
  ON public.finance_transactions FOR UPDATE
  USING (true);

-- ==========================================
-- EXPENSES TABLE
-- ==========================================
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  total_cost NUMERIC NOT NULL,
  etims_amount NUMERIC DEFAULT 0,
  non_etims_amount NUMERIC DEFAULT 0,
  supplier TEXT,
  reference TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'bank_transfer', 'credit')),
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'partial')),
  approved_by UUID REFERENCES public.staff(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read expenses"
  ON public.expenses FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update expenses"
  ON public.expenses FOR UPDATE
  USING (true);

-- ==========================================
-- PROPERTY_SETTINGS TABLE
-- ==========================================
CREATE TABLE public.property_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  check_in_time TIME DEFAULT '14:00',
  check_out_time TIME DEFAULT '11:00',
  currency TEXT DEFAULT 'KSH',
  timezone TEXT DEFAULT 'Africa/Nairobi',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.property_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read property_settings"
  ON public.property_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert property_settings"
  ON public.property_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update property_settings"
  ON public.property_settings FOR UPDATE
  USING (true);

-- ==========================================
-- NOTIFICATION_SETTINGS TABLE
-- ==========================================
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  low_stock_alerts BOOLEAN DEFAULT true,
  maintenance_alerts BOOLEAN DEFAULT true,
  booking_confirmations BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  daily_reports BOOLEAN DEFAULT false,
  weekly_reports BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read notification_settings"
  ON public.notification_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert notification_settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notification_settings"
  ON public.notification_settings FOR UPDATE
  USING (true);

-- ==========================================
-- SYSTEM_PREFERENCES TABLE
-- ==========================================
CREATE TABLE public.system_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language TEXT DEFAULT 'en',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  time_format TEXT DEFAULT '24h',
  auto_backup BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system_preferences"
  ON public.system_preferences FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update system_preferences"
  ON public.system_preferences FOR UPDATE
  USING (true);

-- ==========================================
-- CREATE SECURITY DEFINER FUNCTION FOR ROLE CHECKING
-- ==========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.name = _role_name
      AND ur.is_active = true
      AND (ur.valid_until IS NULL OR ur.valid_until > now())
  )
$$;

-- ==========================================
-- CREATE FUNCTION TO GET USER PERMISSIONS
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS app_permission[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT perm)
  FROM (
    SELECT UNNEST(r.permissions) as perm
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND ur.is_active = true
      AND (ur.valid_until IS NULL OR ur.valid_until > now())
  ) perms
$$;

-- ==========================================
-- ADD UPDATE TRIGGERS FOR ALL TABLES
-- ==========================================
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON public.room_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_housekeeping_staff_updated_at BEFORE UPDATE ON public.housekeeping_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_housekeeping_tasks_updated_at BEFORE UPDATE ON public.housekeeping_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_staff_updated_at BEFORE UPDATE ON public.maintenance_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_issues_updated_at BEFORE UPDATE ON public.maintenance_issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pos_items_updated_at BEFORE UPDATE ON public.pos_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pos_transactions_updated_at BEFORE UPDATE ON public.pos_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_transactions_updated_at BEFORE UPDATE ON public.finance_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_property_settings_updated_at BEFORE UPDATE ON public.property_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_preferences_updated_at BEFORE UPDATE ON public.system_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();