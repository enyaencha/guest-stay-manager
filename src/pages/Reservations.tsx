import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ReservationCard } from "@/components/reservations/ReservationCard";
import { ReservationRequestModal } from "@/components/reservations/ReservationRequestModal";
import { StatCard } from "@/components/dashboard/StatCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRoomTypes } from "@/hooks/useRooms";
import { supabase } from "@/integrations/supabase/client";
import { useTabQueryParam } from "@/hooks/useTabQueryParam";
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Loader2,
  Plus
} from "lucide-react";

interface ReservationRequest {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  source: string | null;
  request_items: Array<{
    room_type: string;
    package?: string | null;
    rooms_count: number;
    guests_count: number;
    check_in: string;
    check_out: string;
  }>;
  special_requests: string | null;
  status: string;
  created_at: string;
}

const normalizeDateTime = (value: string | null | undefined) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
};

const buildBookingKey = (
  roomType: string | null | undefined,
  checkIn: string | null | undefined,
  checkOut: string | null | undefined
) => {
  return `${String(roomType || "").trim().toLowerCase()}|${normalizeDateTime(checkIn)}|${normalizeDateTime(checkOut)}`;
};

const Reservations = () => {
  const [reservations, setReservations] = useState<ReservationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useTabQueryParam({
    key: "status",
    defaultValue: "all",
    allowed: ["all", "pending", "confirmed", "cancelled"],
  });
  const [newReservationOpen, setNewReservationOpen] = useState(false);
  const { data: roomTypes = [] } = useRoomTypes();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      // Fetch reservation requests
      const { data, error } = await (supabase as any)
        .from("reservation_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedData: ReservationRequest[] = (data || []).map((b: any) => ({
        id: b.id,
        guest_name: b.guest_name || 'Unknown',
        guest_phone: b.guest_phone || '',
        guest_email: b.guest_email || null,
        source: b.source || null,
        request_items: Array.isArray(b.request_items) ? b.request_items : [],
        special_requests: b.special_requests,
        status: b.status,
        created_at: b.created_at,
      }));

      setReservations(transformedData);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const ensureDirectBookingsForReservation = async (reservation: ReservationRequest) => {
    const source = reservation.source?.trim().toLowerCase() || "";
    if (source === "website") return;

    const { data: guestRows, error: guestError } = await supabase.rpc("get_or_create_guest" as any, {
      name_input: reservation.guest_name,
      phone_input: reservation.guest_phone,
      email_input: reservation.guest_email || null,
      id_number_input: null,
    });

    if (guestError) throw guestError;

    const guestId = (guestRows as Array<{ id: string }> | null)?.[0]?.id;
    if (!guestId) {
      throw new Error("Unable to create or find guest for this reservation");
    }

    const normalizedItems = reservation.request_items
      .map((item) => {
        const roomType = String(item.room_type || "").trim();
        const checkIn = normalizeDateTime(item.check_in);
        const checkOut = normalizeDateTime(item.check_out);

        return {
          room_type: roomType,
          check_in: checkIn,
          check_out: checkOut,
          guests_count: Math.max(1, Number(item.guests_count) || 1),
          rooms_count: Math.max(1, Number(item.rooms_count) || 1),
        };
      })
      .filter((item) => item.room_type && item.check_in && item.check_out);

    if (normalizedItems.length === 0) {
      throw new Error("Reservation has no valid stay details");
    }

    const expectedBookings = normalizedItems.flatMap((item) =>
      Array.from({ length: item.rooms_count }, () => ({
        room_type: item.room_type,
        check_in: item.check_in,
        check_out: item.check_out,
        guests_count: item.guests_count,
      }))
    );

    const bookingOwnerFilter = `bill_to_guest_id.eq.${guestId},and(bill_to_guest_id.is.null,guest_id.eq.${guestId})`;

    const { data: existingBookings, error: existingError } = await supabase
      .from("bookings")
      .select("room_type, check_in, check_out, status")
      .or(bookingOwnerFilter)
      .in("status", ["confirmed", "reserved", "pre-arrival", "checked-in"]);

    if (existingError) throw existingError;

    const existingCounts = new Map<string, number>();
    (existingBookings || []).forEach((booking) => {
      const key = buildBookingKey(booking.room_type, booking.check_in, booking.check_out);
      existingCounts.set(key, (existingCounts.get(key) || 0) + 1);
    });

    const sourceNote = reservation.source ? `Source: ${reservation.source}` : "";
    const combinedRequests = [sourceNote, reservation.special_requests].filter(Boolean).join(" | ") || null;

    const missingBookings = expectedBookings.reduce<Array<{
      guest_id: string;
      bill_to_guest_id: string;
      room_number: string;
      room_type: string;
      check_in: string;
      check_out: string;
      guests_count: number;
      total_amount: number;
      paid_amount: number;
      payment_method: null;
      status: "confirmed";
      special_requests: string | null;
    }>>((acc, item) => {
      const key = buildBookingKey(item.room_type, item.check_in, item.check_out);
      const availableCount = existingCounts.get(key) || 0;

      if (availableCount > 0) {
        existingCounts.set(key, availableCount - 1);
        return acc;
      }

      acc.push({
        guest_id: guestId,
        bill_to_guest_id: guestId,
        room_number: "TBA",
        room_type: item.room_type,
        check_in: item.check_in,
        check_out: item.check_out,
        guests_count: item.guests_count,
        total_amount: 0,
        paid_amount: 0,
        payment_method: null,
        status: "confirmed",
        special_requests: combinedRequests,
      });
      return acc;
    }, []);

    if (missingBookings.length === 0) return;

    const { error: insertError } = await supabase.from("bookings").insert(missingBookings);
    if (insertError) throw insertError;
  };

  const handleStatusChange = async (id: string, newStatus: string, note?: string) => {
    try {
      const reservation = reservations.find(r => r.id === id);
      if (!reservation) throw new Error("Reservation not found");

      const { error: updateError } = await supabase
        .from("reservation_requests")
        .update({ status: newStatus })
        .eq("id", id);

      if (updateError) throw updateError;

      if (newStatus === "confirmed") {
        await ensureDirectBookingsForReservation(reservation);
      }

      // Create booking notification
      await supabase.from("booking_notifications").insert({
        reservation_request_id: id,
        type: newStatus === 'confirmed' ? 'reservation_confirmed' : 'reservation_cancelled',
        title: newStatus === 'confirmed' ? 'Reservation Confirmed' : 'Reservation Cancelled',
        message: note || (newStatus === 'confirmed' 
          ? `Reservation request for ${reservation.guest_name} has been confirmed.`
          : `Reservation request for ${reservation.guest_name} has been cancelled. Reason: ${note}`),
      });

      // Update local state
      setReservations(prev => prev.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));
    } catch (error) {
      console.error("Error updating reservation:", error);
      throw error;
    }
  };

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === "pending").length,
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    cancelled: reservations.filter(r => r.status === "cancelled").length,
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.guest_phone.includes(searchTerm) ||
      reservation.request_items.some((item) =>
        String(item.room_type || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reservation Requests</h1>
            <p className="text-muted-foreground">
              Review and approve guest booking requests
            </p>
          </div>
          <Button onClick={() => setNewReservationOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Direct Reservation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Requests"
            value={stats.total}
            icon={CalendarCheck}
            description="All reservations"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pending}
            icon={Clock}
            trend={stats.pending > 0 ? { value: stats.pending, isPositive: false } : undefined}
            description="Awaiting review"
          />
          <StatCard
            title="Confirmed"
            value={stats.confirmed}
            icon={CheckCircle}
            description="Approved requests"
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            description="Declined requests"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by guest name, room, or phone..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Reservation Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No reservation requests found
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
      <ReservationRequestModal
        open={newReservationOpen}
        onOpenChange={setNewReservationOpen}
        roomTypes={roomTypes.map((type) => ({ id: type.id, name: type.name, code: type.code }))}
        onCreated={() => fetchReservations()}
      />
    </MainLayout>
  );
};

export default Reservations;
