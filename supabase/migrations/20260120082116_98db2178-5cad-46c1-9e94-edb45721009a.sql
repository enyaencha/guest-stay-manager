-- ============================================
-- GUEST MANAGEMENT, ROOM ASSESSMENT & REFUNDS
-- ============================================

-- 1. Guests table (persistent customer records)
CREATE TABLE public.guests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    id_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Guest issues/history table (track problems linked to guests)
CREATE TABLE public.guest_issues (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID,
    room_number TEXT NOT NULL,
    issue_type TEXT NOT NULL CHECK (issue_type IN ('damage', 'theft', 'noise_complaint', 'policy_violation', 'late_payment', 'other')),
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    cost_incurred NUMERIC(10,2) DEFAULT 0,
    resolved BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Bookings table (track reservations)
CREATE TABLE public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1,
    total_amount NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT,
    status TEXT NOT NULL CHECK (status IN ('pre-arrival', 'checked-in', 'checked-out', 'cancelled', 'no-show')) DEFAULT 'pre-arrival',
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Room assessments table (post-checkout assessment)
CREATE TABLE public.room_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    room_number TEXT NOT NULL,
    assessed_by UUID,
    assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    overall_condition TEXT NOT NULL CHECK (overall_condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    damages_found BOOLEAN DEFAULT false,
    damage_description TEXT,
    damage_cost NUMERIC(10,2) DEFAULT 0,
    missing_items JSONB DEFAULT '[]'::jsonb,
    extra_cleaning_required BOOLEAN DEFAULT false,
    notes TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Refund requests table (refund approval flow)
CREATE TABLE public.refund_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL NOT NULL,
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    room_number TEXT NOT NULL,
    amount_paid NUMERIC(10,2) NOT NULL,
    refund_amount NUMERIC(10,2) NOT NULL,
    reason TEXT NOT NULL,
    room_assessment_id UUID REFERENCES public.room_assessments(id) ON DELETE SET NULL,
    items_utilized JSONB DEFAULT '[]'::jsonb,
    deductions NUMERIC(10,2) DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'processed')) DEFAULT 'pending',
    requested_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Room supplies tracking (items used per room per booking)
CREATE TABLE public.room_supplies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    room_number TEXT NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    is_complimentary BOOLEAN DEFAULT true,
    restocked_by UUID,
    restocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_supplies ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allowing all authenticated users for now - can be refined with roles later)
CREATE POLICY "Authenticated users can read guests"
ON public.guests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert guests"
ON public.guests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update guests"
ON public.guests FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read guest_issues"
ON public.guest_issues FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert guest_issues"
ON public.guest_issues FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update guest_issues"
ON public.guest_issues FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read bookings"
ON public.bookings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert bookings"
ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update bookings"
ON public.bookings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read room_assessments"
ON public.room_assessments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert room_assessments"
ON public.room_assessments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update room_assessments"
ON public.room_assessments FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read refund_requests"
ON public.refund_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert refund_requests"
ON public.refund_requests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update refund_requests"
ON public.refund_requests FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read room_supplies"
ON public.room_supplies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert room_supplies"
ON public.room_supplies FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update room_supplies"
ON public.room_supplies FOR UPDATE TO authenticated USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_guests_updated_at
    BEFORE UPDATE ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refund_requests_updated_at
    BEFORE UPDATE ON public.refund_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_guest_issues_guest_id ON public.guest_issues(guest_id);
CREATE INDEX idx_bookings_guest_id ON public.bookings(guest_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_room_assessments_booking_id ON public.room_assessments(booking_id);
CREATE INDEX idx_refund_requests_booking_id ON public.refund_requests(booking_id);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX idx_room_supplies_booking_id ON public.room_supplies(booking_id);