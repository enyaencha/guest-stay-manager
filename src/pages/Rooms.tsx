import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { AvailabilityCalendar } from "@/components/rooms/AvailabilityCalendar";
import { RoomDetailModal } from "@/components/rooms/RoomDetailModal";
import { useRooms, useUpdateRoom, Room as DBRoom } from "@/hooks/useRooms";
import { useBookings, useGuests } from "@/hooks/useGuests";
import { Room } from "@/types/room";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, LayoutGrid, Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";

// Map database room to legacy Room type
const mapToLegacyRoom = (room: DBRoom): Room => ({
  id: room.id,
  number: room.number,
  name: room.name,
  type: room.max_occupancy <= 2 ? 'single' : room.max_occupancy <= 3 ? 'double' : 'suite',
  floor: room.floor,
  maxOccupancy: room.max_occupancy,
  occupancyStatus: room.occupancy_status as 'vacant' | 'occupied' | 'checkout' | 'reserved',
  cleaningStatus: room.cleaning_status as 'clean' | 'dirty' | 'in-progress' | 'inspecting',
  maintenanceStatus: room.maintenance_status as 'none' | 'pending' | 'in-progress',
  basePrice: room.base_price,
  amenities: room.amenities || [],
  currentGuest: room.current_guest_id ? 'Guest' : undefined,
});

const Rooms = () => {
  const { data: dbRooms, isLoading: roomsLoading } = useRooms();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: guests = [], isLoading: guestsLoading } = useGuests();
  const updateRoom = useUpdateRoom();
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [calendarStart, setCalendarStart] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const guestLookup = useMemo(() => {
    return new Map(guests.map((guest) => [guest.id, guest.name]));
  }, [guests]);

  const rooms = useMemo(() => {
    if (!dbRooms) return [];
    return dbRooms.map((room) => {
      const roomBookings = bookings
        .filter((booking) => booking.room_number === room.number)
        .sort((a, b) => parseISO(b.check_in).getTime() - parseISO(a.check_in).getTime());

      const latestBooking = roomBookings[0];
      const guestName = latestBooking?.guest_id ? guestLookup.get(latestBooking.guest_id) : undefined;

      return {
        ...mapToLegacyRoom(room),
        currentGuest: guestName || (room.current_guest_id ? "Guest" : undefined),
        checkInDate: latestBooking?.check_in,
        checkOutDate: latestBooking?.check_out,
      };
    });
  }, [dbRooms, bookings, guestLookup]);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setModalOpen(true);
  };

  const handleUpdateRoom = (roomId: string, updates: Partial<Room>) => {
    // Map legacy updates to database format
    const dbUpdates: Partial<DBRoom> = {};
    if (updates.occupancyStatus) dbUpdates.occupancy_status = updates.occupancyStatus;
    if (updates.cleaningStatus) dbUpdates.cleaning_status = updates.cleaningStatus;
    if (updates.maintenanceStatus) dbUpdates.maintenance_status = updates.maintenanceStatus;
    
    updateRoom.mutate({ id: roomId, updates: dbUpdates });
  };

  const isLoading = roomsLoading || bookingsLoading || guestsLoading;

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
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
            <p className="text-muted-foreground">
              Manage your property inventory
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'calendar')}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Grid View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendar View
              </TabsTrigger>
            </TabsList>

            {viewMode === 'calendar' && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCalendarStart(addDays(calendarStart, -7))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[180px] text-center">
                  {format(calendarStart, 'MMM d')} - {format(addDays(calendarStart, 13), 'MMM d, yyyy')}
                </span>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCalendarStart(addDays(calendarStart, 7))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="grid" className="mt-4">
            <RoomGrid rooms={rooms} onRoomClick={handleRoomClick} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <AvailabilityCalendar
              rooms={rooms}
              bookings={bookings}
              guests={guests}
              startDate={calendarStart}
              daysToShow={14}
            />
          </TabsContent>
        </Tabs>
      </div>

      <RoomDetailModal 
        room={selectedRoom}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdateStatus={handleUpdateRoom}
      />
    </MainLayout>
  );
};

export default Rooms;
