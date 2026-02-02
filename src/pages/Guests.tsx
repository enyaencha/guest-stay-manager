import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { GuestCard } from "@/components/guests/GuestCard";
import { ConfirmedBookingCard } from "@/components/guests/ConfirmedBookingCard";
import { RoomAssignmentModal } from "@/components/guests/RoomAssignmentModal";
import { RequestCard } from "@/components/guests/RequestCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGuests, useBookings, useUpdateBooking } from "@/hooks/useGuests";
import { usePOSTransactions, useUpdatePOSTransaction } from "@/hooks/usePOS";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest, GuestRequest } from "@/types/guest";
import { 
  Users, 
  UserCheck, 
  Clock, 
  Plus, 
  Search,
  Bell,
  Loader2,
  CalendarCheck
} from "lucide-react";
import { toast } from "sonner";

interface ConfirmedBooking {
  id: string;
  guest_id: string | null;
  guest_name: string;
  guest_phone: string;
  room_type: string;
  room_number: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  special_requests: string | null;
}

const Guests = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomAssignmentOpen, setRoomAssignmentOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ConfirmedBooking | null>(null);

  const { data: guests = [], isLoading: guestsLoading } = useGuests();
  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useBookings();
  const { data: posTransactions = [], isLoading: posLoading } = usePOSTransactions();
  const updateBooking = useUpdateBooking();
  const updatePOSTransaction = useUpdatePOSTransaction();
  const queryClient = useQueryClient();

  // Fetch guest issues for requests
  const { data: guestIssues = [] } = useQuery({
    queryKey: ["guest_issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_issues")
        .select("*, guests(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roomAssessments = [] } = useQuery({
    queryKey: ["room_assessments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_assessments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateIssue = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const { error } = await supabase
        .from("guest_issues")
        .update({ resolved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_issues"] });
      toast.success("Request updated");
    },
  });

  // Get confirmed bookings awaiting room assignment
  const confirmedBookings: ConfirmedBooking[] = bookings
    .filter(b => b.status === 'confirmed')
    .map(b => {
      const guest = guests.find(g => g.id === b.guest_id);
      return {
        id: b.id,
        guest_id: b.guest_id,
        guest_name: guest?.name || 'Unknown',
        guest_phone: guest?.phone || '',
        room_type: b.room_type,
        room_number: b.room_number,
        check_in: b.check_in,
        check_out: b.check_out,
        guests_count: b.guests_count,
        total_amount: b.total_amount,
        special_requests: b.special_requests,
      };
    });

  // Combine guests with their bookings - exclude reserved (handled in Reservations page)
  const guestsWithBookings = guests.map(guest => {
    const booking = bookings.find(b => b.guest_id === guest.id && !['reserved', 'confirmed'].includes(b.status));
    return {
      ...guest,
      booking,
    };
  }).filter(g => g.booking);

  // Convert to Guest type for component
  const guestData: Guest[] = guestsWithBookings.map(g => ({
    id: g.id,
    name: g.name,
    email: g.email || '',
    phone: g.phone,
    bookingId: g.booking?.id,
    roomNumber: g.booking?.room_number || '',
    roomType: (g.booking?.room_type || 'single') as Guest['roomType'],
    checkIn: g.booking?.check_in || '',
    checkOut: g.booking?.check_out || '',
    status: (g.booking?.status === 'checked-in' ? 'checked-in' : 
             g.booking?.status === 'checked-out' ? 'checked-out' : 'pre-arrival') as Guest['status'],
    totalAmount: g.booking?.total_amount || 0,
    paidAmount: g.booking?.paid_amount || 0,
    guests: g.booking?.guests_count || 1,
    specialRequests: g.booking?.special_requests || undefined,
    posTransactions: posTransactions
      .filter((t) =>
        (t.guest_id && t.guest_id === g.id) ||
        (g.booking?.room_number && t.room_number === g.booking.room_number)
      )
      .map((t) => ({
        id: t.id,
        date: t.created_at,
        total: t.total,
        paymentMethod: t.payment_method,
        status: t.status,
        itemsSummary: Array.isArray(t.items)
          ? (t.items as { name: string; quantity: number; price: number }[])
              .map((item) => `${item.quantity}x ${item.name}`)
              .join(", ")
          : "",
      })),
    lastAssessment: (() => {
      const assessment = roomAssessments.find((a) => a.guest_id === g.id);
      if (!assessment) return undefined;
      const missingItems = Array.isArray(assessment.missing_items) ? assessment.missing_items : [];
      const missingCost = missingItems.reduce((sum: number, item: any) => sum + (Number(item.cost) || 0), 0);
      return {
        overallCondition: assessment.overall_condition,
        damagesFound: assessment.damages_found || false,
        missingItemsCount: missingItems.length,
        damageCost: Number(assessment.damage_cost) || 0,
        missingCost: Number(missingCost),
      };
    })(),
  }));

  // Convert issues to requests
  const requests: GuestRequest[] = guestIssues.map(issue => ({
    id: issue.id,
    guestId: issue.guest_id,
    guestName: issue.guests?.name || 'Unknown Guest',
    roomNumber: issue.room_number,
    type: issue.issue_type as GuestRequest['type'],
    description: issue.description,
    status: issue.resolved ? 'completed' : 'pending',
    priority: issue.severity as GuestRequest['priority'],
    createdAt: issue.created_at,
  }));

  const stats = {
    totalGuests: guestData.length,
    checkedIn: guestData.filter(g => g.status === "checked-in").length,
    preArrival: guestData.filter(g => g.status === "pre-arrival").length,
    pendingRequests: confirmedBookings.length,
  };

  const filteredGuests = guestData.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.roomNumber.includes(searchTerm) ||
      guest.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || guest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCheckIn = async (id: string) => {
    const guest = guestsWithBookings.find(g => g.id === id);
    if (guest?.booking) {
      await updateBooking.mutateAsync({
        id: guest.booking.id,
        updates: { status: 'checked-in' }
      });
      toast.success("Guest checked in successfully");
    }
  };

  const handleCheckOut = async (id: string) => {
    const guest = guestsWithBookings.find(g => g.id === id);
    if (guest?.booking) {
      await updateBooking.mutateAsync({
        id: guest.booking.id,
        updates: { status: 'checked-out' }
      });
      toast.success("Guest checked out successfully");
    }
  };

  const handleRecordPayment = async (
    id: string,
    amount: number,
    method: "mpesa" | "withdraw" | "card" | "bank-transfer"
  ) => {
    const guest = guestsWithBookings.find(g => g.id === id);
    if (!guest?.booking) return;
    const currentPaid = guest.booking.paid_amount || 0;
    const total = guest.booking.total_amount || 0;

    const guestPos = posTransactions.filter((t) => {
      const matchesGuest = t.guest_id && t.guest_id === guest.id;
      const matchesRoom = guest.booking?.room_number && t.room_number === guest.booking.room_number;
      return matchesGuest || matchesRoom;
    });
    const pendingPos = guestPos.filter((t) => t.status === "pending");
    const completedPosTotal = guestPos
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.total, 0);
    const pendingTotal = pendingPos.reduce((sum, t) => sum + t.total, 0);

    const assessment = roomAssessments.find((a) => a.guest_id === guest.id);
    const assessmentMissing = assessment && Array.isArray(assessment.missing_items) ? assessment.missing_items : [];
    const assessmentMissingCost = assessmentMissing.reduce(
      (sum: number, item: any) => sum + (Number(item.cost) || 0),
      0
    );
    const assessmentCost = Number(assessment?.damage_cost || 0) + Number(assessmentMissingCost);

    const paidTotalBefore = currentPaid + completedPosTotal;
    const totalDue = total + pendingTotal + assessmentCost;

    const nextPaid = currentPaid + amount;
    await updateBooking.mutateAsync({
      id: guest.booking.id,
      updates: { paid_amount: nextPaid },
    });

    if (pendingPos.length > 0 && paidTotalBefore + amount >= totalDue) {
      await Promise.all(
        pendingPos.map((txn) =>
          updatePOSTransaction.mutateAsync({
            id: txn.id,
            updates: { status: "completed", payment_method: method },
          })
        )
      );
      toast.success("POS charges marked as paid");
    } else if (pendingPos.length > 0) {
      toast.warning("Payment recorded. POS charges still pending (partial payment).");
    }

    toast.success(`Payment of Ksh ${amount} recorded`);
  };

  const handleUpdateRequestStatus = (id: string, status: GuestRequest["status"]) => {
    updateIssue.mutate({ id, resolved: status === 'completed' });
  };

  const handleAssignRoom = (booking: ConfirmedBooking) => {
    setSelectedBooking(booking);
    setRoomAssignmentOpen(true);
  };

  const handleRoomAssigned = () => {
    refetchBookings();
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  const isLoadingAll = guestsLoading || bookingsLoading || posLoading;

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Guest Management</h1>
            <p className="text-muted-foreground">
              Track guest journeys from booking to checkout
            </p>
          </div>
          <Button onClick={() => setBookingOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Guests"
            value={stats.totalGuests}
            icon={Users}
            description="Active bookings"
          />
          <StatCard
            title="Checked In"
            value={stats.checkedIn}
            icon={UserCheck}
            trend={{ value: 12, isPositive: true }}
            description="Currently staying"
          />
          <StatCard
            title="Arriving Today"
            value={stats.preArrival}
            icon={Clock}
            description="Expected check-ins"
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={CalendarCheck}
            trend={stats.pendingRequests > 0 ? { value: stats.pendingRequests, isPositive: false } : undefined}
            description="Awaiting room assignment"
          />
        </div>

        {isLoadingAll ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Tabs */
          <Tabs defaultValue="guests" className="space-y-4">
            <TabsList>
              <TabsTrigger value="guests">Guests</TabsTrigger>
              <TabsTrigger value="requests">Requests ({confirmedBookings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="guests" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name, room, or email..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="checked-in">Checked In</TabsTrigger>
                    <TabsTrigger value="pre-arrival">Pre-Arrival</TabsTrigger>
                    <TabsTrigger value="checked-out">Checked Out</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Guest Grid */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredGuests.map((guest) => (
                  <GuestCard 
                    key={guest.id} 
                    guest={guest}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                    onRecordPayment={handleRecordPayment}
                  />
                ))}
              </div>

              {filteredGuests.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No guests found matching your criteria
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {confirmedBookings.map((booking) => (
                  <ConfirmedBookingCard
                    key={booking.id}
                    booking={booking}
                    onAssignRoom={handleAssignRoom}
                  />
                ))}
              </div>

              {confirmedBookings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No confirmed bookings awaiting room assignment
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BookingWizard open={bookingOpen} onOpenChange={setBookingOpen} />
      
      <RoomAssignmentModal
        open={roomAssignmentOpen}
        onOpenChange={setRoomAssignmentOpen}
        booking={selectedBooking}
        onAssigned={handleRoomAssigned}
      />
    </MainLayout>
  );
};

export default Guests;
