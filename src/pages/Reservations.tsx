import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ReservationCard } from "@/components/reservations/ReservationCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Loader2
} from "lucide-react";

interface ReservationRequest {
  id: string;
  guest_id: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  special_requests: string | null;
  status: string;
  created_at: string;
}

const Reservations = () => {
  const [reservations, setReservations] = useState<ReservationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      // Fetch bookings with 'reserved' status (pending requests)
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          guests (name, phone, email)
        `)
        .in("status", ["reserved", "confirmed", "cancelled"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedData: ReservationRequest[] = (data || []).map(b => ({
        id: b.id,
        guest_id: b.guest_id,
        guest_name: b.guests?.name || 'Unknown',
        guest_phone: b.guests?.phone || '',
        guest_email: b.guests?.email || null,
        room_number: b.room_number,
        room_type: b.room_type,
        check_in: b.check_in,
        check_out: b.check_out,
        guests_count: b.guests_count,
        total_amount: b.total_amount,
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

  const handleStatusChange = async (id: string, newStatus: string, note?: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Update booking notification
      const reservation = reservations.find(r => r.id === id);
      if (reservation) {
        await supabase.from("booking_notifications").insert({
          booking_id: id,
          type: newStatus === 'confirmed' ? 'reservation_confirmed' : 'reservation_cancelled',
          title: newStatus === 'confirmed' ? 'Reservation Confirmed' : 'Reservation Cancelled',
          message: note || (newStatus === 'confirmed' 
            ? `Your reservation for Room ${reservation.room_number} has been confirmed.`
            : `Your reservation for Room ${reservation.room_number} has been cancelled.`),
        });
      }

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
    pending: reservations.filter(r => r.status === "reserved").length,
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    cancelled: reservations.filter(r => r.status === "cancelled").length,
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.room_number.includes(searchTerm) ||
      reservation.guest_phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservation Requests</h1>
          <p className="text-muted-foreground">
            Review and approve guest booking requests
          </p>
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
              <TabsTrigger value="reserved">Pending</TabsTrigger>
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
    </MainLayout>
  );
};

export default Reservations;
