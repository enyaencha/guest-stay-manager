-- Fix Issue 1: PUBLIC_DATA_EXPOSURE - Restrict guests table to authenticated users only
-- Drop overly permissive policies on guests table
DROP POLICY IF EXISTS "Anyone can read guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can insert guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can update guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can read guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can insert guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can update guests" ON public.guests;

-- Create authentication-based policies for guests
CREATE POLICY "Authenticated users can read guests"
ON public.guests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert guests"
ON public.guests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update guests"
ON public.guests FOR UPDATE TO authenticated USING (true);

-- Fix Issue 2: CLIENT_SIDE_AUTH - Add permission-based RLS policies for sensitive tables
-- Create a helper function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _permission = ANY(public.get_user_permissions(_user_id));
$$;

-- Add permission-based policies for staff table (sensitive)
DROP POLICY IF EXISTS "Authenticated users can read staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can insert staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can update staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can delete staff" ON public.staff;

CREATE POLICY "Users with staff.view can read staff"
ON public.staff FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'staff.view') OR public.has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with staff.manage can insert staff"
ON public.staff FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with staff.manage can update staff"
ON public.staff FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with staff.manage can delete staff"
ON public.staff FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(), 'staff.manage'));

-- Add permission-based policies for user_roles table (very sensitive)
DROP POLICY IF EXISTS "Authenticated users can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with staff.manage can insert user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with staff.manage can update user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with staff.manage can delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(), 'staff.manage'));

-- Add permission-based policies for roles table
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can update roles" ON public.roles;

CREATE POLICY "Users with staff.view can read roles"
ON public.roles FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'staff.view') OR public.has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with staff.manage can insert roles"
ON public.roles FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'staff.manage'));

CREATE POLICY "Users with staff.manage can update roles"
ON public.roles FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'staff.manage'));

-- Add permission-based policies for finance_transactions table
DROP POLICY IF EXISTS "Authenticated users can read finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Authenticated users can insert finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Authenticated users can update finance_transactions" ON public.finance_transactions;

CREATE POLICY "Users with finance permission can read transactions"
ON public.finance_transactions FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'finance.view') OR public.has_permission(auth.uid(), 'finance.manage'));

CREATE POLICY "Users with finance.manage can insert transactions"
ON public.finance_transactions FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'finance.manage'));

CREATE POLICY "Users with finance.manage can update transactions"
ON public.finance_transactions FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'finance.manage'));

-- Add permission-based policies for expenses table
DROP POLICY IF EXISTS "Authenticated users can read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;

CREATE POLICY "Users with finance permission can read expenses"
ON public.expenses FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'finance.view') OR public.has_permission(auth.uid(), 'finance.manage'));

CREATE POLICY "Users with finance.manage can insert expenses"
ON public.expenses FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'finance.manage'));

CREATE POLICY "Users with finance.manage can update expenses"
ON public.expenses FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'finance.manage'));

-- Add permission-based policies for refund_requests table
DROP POLICY IF EXISTS "Authenticated users can read refund_requests" ON public.refund_requests;
DROP POLICY IF EXISTS "Authenticated users can insert refund_requests" ON public.refund_requests;
DROP POLICY IF EXISTS "Authenticated users can update refund_requests" ON public.refund_requests;

CREATE POLICY "Users with refunds permission can read refunds"
ON public.refund_requests FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'refunds.view') OR public.has_permission(auth.uid(), 'refunds.approve'));

CREATE POLICY "Users with refunds permission can insert refunds"
ON public.refund_requests FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'refunds.view') OR public.has_permission(auth.uid(), 'refunds.approve'));

CREATE POLICY "Users with refunds.approve can update refunds"
ON public.refund_requests FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'refunds.approve'));