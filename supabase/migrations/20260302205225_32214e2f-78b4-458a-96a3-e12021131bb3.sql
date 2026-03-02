
-- ============================================================
-- FIX 1: Drop "Anyone can" policies and replace with authenticated-only
-- ============================================================

-- BOOKINGS
DROP POLICY IF EXISTS "Anyone can read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;

CREATE POLICY "Authenticated users can read bookings"
  ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert bookings"
  ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update bookings"
  ON public.bookings FOR UPDATE TO authenticated USING (true);

-- POS TRANSACTIONS
DROP POLICY IF EXISTS "Anyone can read pos_transactions" ON public.pos_transactions;
DROP POLICY IF EXISTS "Anyone can insert pos_transactions" ON public.pos_transactions;
DROP POLICY IF EXISTS "Anyone can update pos_transactions" ON public.pos_transactions;

CREATE POLICY "Authenticated users can read pos_transactions"
  ON public.pos_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pos_transactions"
  ON public.pos_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pos_transactions"
  ON public.pos_transactions FOR UPDATE TO authenticated USING (true);

-- POS ITEMS
DROP POLICY IF EXISTS "Anyone can read pos_items" ON public.pos_items;
DROP POLICY IF EXISTS "Anyone can insert pos_items" ON public.pos_items;
DROP POLICY IF EXISTS "Anyone can update pos_items" ON public.pos_items;

CREATE POLICY "Authenticated users can read pos_items"
  ON public.pos_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pos_items"
  ON public.pos_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pos_items"
  ON public.pos_items FOR UPDATE TO authenticated USING (true);

-- FINANCE TRANSACTIONS
DROP POLICY IF EXISTS "Anyone can read finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Anyone can insert finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Anyone can update finance_transactions" ON public.finance_transactions;
-- Keep the permission-based policies that already exist for finance

-- ROOM SUPPLIES
DROP POLICY IF EXISTS "Anyone can read room_supplies" ON public.room_supplies;
DROP POLICY IF EXISTS "Anyone can insert room_supplies" ON public.room_supplies;
DROP POLICY IF EXISTS "Anyone can update room_supplies" ON public.room_supplies;

CREATE POLICY "Authenticated users can read room_supplies"
  ON public.room_supplies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert room_supplies"
  ON public.room_supplies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update room_supplies"
  ON public.room_supplies FOR UPDATE TO authenticated USING (true);

-- GUEST ISSUES
DROP POLICY IF EXISTS "Anyone can read guest_issues" ON public.guest_issues;
DROP POLICY IF EXISTS "Anyone can insert guest_issues" ON public.guest_issues;
DROP POLICY IF EXISTS "Anyone can update guest_issues" ON public.guest_issues;

CREATE POLICY "Authenticated users can read guest_issues"
  ON public.guest_issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert guest_issues"
  ON public.guest_issues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update guest_issues"
  ON public.guest_issues FOR UPDATE TO authenticated USING (true);

-- BOOKING NOTIFICATIONS
DROP POLICY IF EXISTS "Anyone can read booking_notifications" ON public.booking_notifications;
DROP POLICY IF EXISTS "Anyone can insert booking_notifications" ON public.booking_notifications;
DROP POLICY IF EXISTS "Anyone can update booking_notifications" ON public.booking_notifications;

CREATE POLICY "Authenticated users can read booking_notifications"
  ON public.booking_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert booking_notifications"
  ON public.booking_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update booking_notifications"
  ON public.booking_notifications FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- FIX 2: Make guest storage buckets private
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id IN ('guest-ids', 'guest-docs');

-- Add authenticated-only read policies for storage objects
DROP POLICY IF EXISTS "Authenticated users can read guest-ids" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read guest-docs" ON storage.objects;

CREATE POLICY "Authenticated users can read guest-ids"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'guest-ids');

CREATE POLICY "Authenticated users can read guest-docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'guest-docs');
