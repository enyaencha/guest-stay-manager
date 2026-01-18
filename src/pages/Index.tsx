import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { SystemStatusWidget } from "@/components/dashboard/SystemStatusWidget";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { mockRooms, calculateStats } from "@/data/mockRooms";
import { 
  BedDouble, 
  Users, 
  Sparkles, 
  Wrench,
  LogIn,
  LogOut,
  TrendingUp,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [filter, setFilter] = useState("all");
  const [bookingOpen, setBookingOpen] = useState(false);
  const stats = calculateStats(mockRooms);

  const filteredRooms = useMemo(() => {
    switch (filter) {
      case "occupied":
        return mockRooms.filter(r => r.occupancyStatus === 'occupied');
      case "vacant":
        return mockRooms.filter(r => r.occupancyStatus === 'vacant');
      case "cleaning":
        return mockRooms.filter(r => r.cleaningStatus !== 'clean');
      case "maintenance":
        return mockRooms.filter(r => r.maintenanceStatus !== 'none');
      default:
        return mockRooms;
    }
  }, [filter]);

  const filterCounts = {
    all: mockRooms.length,
    occupied: mockRooms.filter(r => r.occupancyStatus === 'occupied').length,
    vacant: mockRooms.filter(r => r.occupancyStatus === 'vacant').length,
    cleaning: mockRooms.filter(r => r.cleaningStatus !== 'clean').length,
    maintenance: mockRooms.filter(r => r.maintenanceStatus !== 'none').length,
  };

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
            value={`${stats.occupancyRate}%`}
            subtitle={`${stats.occupied} of ${stats.totalRooms} rooms`}
            icon={TrendingUp}
            variant="accent"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Available Rooms"
            value={stats.vacant}
            subtitle="Ready for check-in"
            icon={BedDouble}
            variant="success"
          />
          <StatCard
            title="Needs Cleaning"
            value={stats.cleaning}
            subtitle="Pending housekeeping"
            icon={Sparkles}
            variant={stats.cleaning > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Maintenance"
            value={stats.maintenance}
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
                <p className="text-2xl font-bold">{stats.checkinsToday}</p>
                <p className="text-sm text-muted-foreground">Check-ins Today</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
              <div className="p-3 rounded-lg bg-status-checkout/10">
                <LogOut className="h-5 w-5 text-status-checkout" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.checkoutsToday}</p>
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
