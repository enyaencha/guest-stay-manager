import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { SystemStatusWidget } from "@/components/dashboard/SystemStatusWidget";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { useRooms, useRoomStats, Room } from "@/hooks/useRooms";
import { useGuests } from "@/hooks/useGuests";
import { 
  BedDouble, 
  Users, 
  Sparkles, 
  Wrench,
  LogIn,
  LogOut,
  TrendingUp,
  Plus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Map database room to legacy Room type for RoomGrid
const mapToLegacyRoom = (room: Room) => ({
  id: room.id,
  number: room.number,
  name: room.name,
  type: room.max_occupancy <= 2 ? 'single' as const : room.max_occupancy <= 3 ? 'double' as const : 'suite' as const,
  floor: room.floor,
  maxOccupancy: room.max_occupancy,
  occupancyStatus: room.occupancy_status as 'vacant' | 'occupied' | 'checkout' | 'reserved',
  cleaningStatus: room.cleaning_status as 'clean' | 'dirty' | 'in-progress' | 'inspecting',
  maintenanceStatus: room.maintenance_status as 'none' | 'pending' | 'in-progress',
  basePrice: room.base_price,
  amenities: room.amenities || [],
  currentGuest: room.current_guest_id ? 'Guest' : undefined,
});

const Index = () => {
  const [filter, setFilter] = useState("all");
  const [bookingOpen, setBookingOpen] = useState(false);
  
  const { data: rooms, isLoading } = useRooms();
  const { data: guests = [] } = useGuests();
  const stats = useRoomStats();

  const guestLookup = useMemo(() => {
    return new Map(guests.map((guest) => [guest.id, guest.name]));
  }, [guests]);

  const mappedRooms = useMemo(() => {
    if (!rooms) return [];
    return rooms.map((room) => ({
      ...mapToLegacyRoom(room),
      currentGuest: room.current_guest_id ? guestLookup.get(room.current_guest_id) || "Guest" : undefined,
    }));
  }, [rooms, guestLookup]);

  const filteredRooms = useMemo(() => {
    switch (filter) {
      case "occupied":
        return mappedRooms.filter(r => r.occupancyStatus === 'occupied');
      case "vacant":
        return mappedRooms.filter(r => r.occupancyStatus === 'vacant');
      case "cleaning":
        return mappedRooms.filter(r => r.cleaningStatus !== 'clean');
      case "maintenance":
        return mappedRooms.filter(r => r.maintenanceStatus !== 'none');
      default:
        return mappedRooms;
    }
  }, [filter, mappedRooms]);

  const filterCounts = useMemo(() => ({
    all: mappedRooms.length,
    occupied: mappedRooms.filter(r => r.occupancyStatus === 'occupied').length,
    vacant: mappedRooms.filter(r => r.occupancyStatus === 'vacant').length,
    cleaning: mappedRooms.filter(r => r.cleaningStatus !== 'clean').length,
    maintenance: mappedRooms.filter(r => r.maintenanceStatus !== 'none').length,
  }), [mappedRooms]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your property operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setBookingOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
            <QuickActions />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Occupancy Rate"
            value={`${stats?.occupancyRate || 0}%`}
            subtitle={`${stats?.occupied || 0} of ${stats?.totalRooms || 0} rooms`}
            icon={TrendingUp}
            variant="accent"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Available Rooms"
            value={stats?.vacant || 0}
            subtitle="Ready for check-in"
            icon={BedDouble}
            variant="success"
          />
          <StatCard
            title="Needs Cleaning"
            value={stats?.cleaning || 0}
            subtitle="Pending housekeeping"
            icon={Sparkles}
            variant={(stats?.cleaning || 0) > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Maintenance"
            value={stats?.maintenance || 0}
            subtitle="Issues reported"
            icon={Wrench}
          />
        </div>

        {/* Today's Activity + System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
              <div className="p-3 rounded-lg bg-status-available/10">
                <LogIn className="h-5 w-5 text-status-available" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.checkinsToday || 0}</p>
                <p className="text-sm text-muted-foreground">Check-ins Today</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
              <div className="p-3 rounded-lg bg-status-checkout/10">
                <LogOut className="h-5 w-5 text-status-checkout" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.checkoutsToday || 0}</p>
                <p className="text-sm text-muted-foreground">Check-outs Today</p>
              </div>
            </div>
          </div>
          <SystemStatusWidget />
        </div>

        {/* Room Status Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Room Status</h2>
            <FilterTabs 
              value={filter} 
              onChange={setFilter} 
              counts={filterCounts}
            />
          </div>
          <RoomGrid rooms={filteredRooms} />
        </div>
      </div>

      <BookingWizard open={bookingOpen} onOpenChange={setBookingOpen} />
    </MainLayout>
  );
};

export default Index;
