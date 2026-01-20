-- Drop existing RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can insert guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can read guests" ON public.guests;
DROP POLICY IF EXISTS "Authenticated users can update guests" ON public.guests;

DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON public.bookings;

DROP POLICY IF EXISTS "Authenticated users can insert pos_transactions" ON public.pos_transactions;
DROP POLICY IF EXISTS "Authenticated users can read pos_transactions" ON public.pos_transactions;
DROP POLICY IF EXISTS "Authenticated users can update pos_transactions" ON public.pos_transactions;

DROP POLICY IF EXISTS "Authenticated users can insert pos_items" ON public.pos_items;
DROP POLICY IF EXISTS "Authenticated users can read pos_items" ON public.pos_items;
DROP POLICY IF EXISTS "Authenticated users can update pos_items" ON public.pos_items;

DROP POLICY IF EXISTS "Authenticated users can insert finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Authenticated users can read finance_transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Authenticated users can update finance_transactions" ON public.finance_transactions;

DROP POLICY IF EXISTS "Authenticated users can insert room_supplies" ON public.room_supplies;
DROP POLICY IF EXISTS "Authenticated users can read room_supplies" ON public.room_supplies;
DROP POLICY IF EXISTS "Authenticated users can update room_supplies" ON public.room_supplies;

DROP POLICY IF EXISTS "Authenticated users can insert guest_issues" ON public.guest_issues;
DROP POLICY IF EXISTS "Authenticated users can read guest_issues" ON public.guest_issues;
DROP POLICY IF EXISTS "Authenticated users can update guest_issues" ON public.guest_issues;

-- Recreate as PERMISSIVE policies (allow all operations for now)
-- Guests
CREATE POLICY "Anyone can read guests" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert guests" ON public.guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update guests" ON public.guests FOR UPDATE USING (true);

-- Bookings
CREATE POLICY "Anyone can read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update bookings" ON public.bookings FOR UPDATE USING (true);

-- POS Transactions
CREATE POLICY "Anyone can read pos_transactions" ON public.pos_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pos_transactions" ON public.pos_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pos_transactions" ON public.pos_transactions FOR UPDATE USING (true);

-- POS Items
CREATE POLICY "Anyone can read pos_items" ON public.pos_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pos_items" ON public.pos_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pos_items" ON public.pos_items FOR UPDATE USING (true);

-- Finance Transactions
CREATE POLICY "Anyone can read finance_transactions" ON public.finance_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert finance_transactions" ON public.finance_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update finance_transactions" ON public.finance_transactions FOR UPDATE USING (true);

-- Room Supplies
CREATE POLICY "Anyone can read room_supplies" ON public.room_supplies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert room_supplies" ON public.room_supplies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update room_supplies" ON public.room_supplies FOR UPDATE USING (true);

-- Guest Issues
CREATE POLICY "Anyone can read guest_issues" ON public.guest_issues FOR SELECT USING (true);
CREATE POLICY "Anyone can insert guest_issues" ON public.guest_issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update guest_issues" ON public.guest_issues FOR UPDATE USING (true);