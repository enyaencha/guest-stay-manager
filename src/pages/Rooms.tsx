import { useEffect, useMemo, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { AvailabilityCalendar } from "@/components/rooms/AvailabilityCalendar";
import { RoomDetailModal } from "@/components/rooms/RoomDetailModal";
import { AddRoomModal } from "@/components/rooms/AddRoomModal";
import { useRooms, useUpdateRoom, Room as DBRoom } from "@/hooks/useRooms";
import { useBookings, useGuests } from "@/hooks/useGuests";
import { Room } from "@/types/room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, Calendar, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";
import { useTabQueryParam } from "@/hooks/useTabQueryParam";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const queryClient = useQueryClient();
  const isSyncingRoomStatusRef = useRef(false);
  
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [calendarStart, setCalendarStart] = useState(new Date());
  const [roomSearchInput, setRoomSearchInput] = useState("");
  const [roomSearchTerm, setRoomSearchTerm] = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState<"all" | Room["occupancyStatus"]>("all");
  const [viewMode, setViewMode] = useTabQueryParam({
    key: "view",
    defaultValue: "grid",
    allowed: ["grid", "calendar"],
  });

  const guestLookup = useMemo(() => {
    return new Map(guests.map((guest) => [guest.id, guest.name]));
  }, [guests]);

  const bookingsByRoom = useMemo(() => {
    const byRoom = new Map<string, typeof bookings>();
    bookings
      .filter((booking) => !!booking.room_number && booking.room_number !== "TBA")
      .forEach((booking) => {
        const current = byRoom.get(booking.room_number) || [];
        current.push(booking);
        byRoom.set(booking.room_number, current);
      });

    byRoom.forEach((roomBookings, roomNumber) => {
      byRoom.set(
        roomNumber,
        [...roomBookings].sort(
          (a, b) => parseISO(b.check_in).getTime() - parseISO(a.check_in).getTime()
        )
      );
    });

    return byRoom;
  }, [bookings]);

  useEffect(() => {
    if (!dbRooms || dbRooms.length === 0 || isSyncingRoomStatusRef.current) return;

    const staleStatusUpdates = dbRooms.flatMap((room) => {
      const roomBookings = bookingsByRoom.get(room.number) || [];
      const hasCheckedIn = roomBookings.some((b) => b.status === "checked-in");
      const hasReserved = roomBookings.some((b) =>
        ["pre-arrival", "confirmed", "reserved"].includes(b.status)
      );
      const hasCheckedOut = roomBookings.some((b) => b.status === "checked-out");

      if (room.occupancy_status === "occupied" && !hasCheckedIn) {
        const nextStatus = hasCheckedOut ? "checkout" : hasReserved ? "reserved" : "vacant";
        const updates: Partial<DBRoom> = {
          occupancy_status: nextStatus,
          current_guest_id: null,
          current_booking_id: null,
        };

        if (nextStatus === "checkout" && room.cleaning_status === "clean") {
          updates.cleaning_status = "dirty";
        }

        return [{ id: room.id, updates }];
      }

      return [];
    });

    if (staleStatusUpdates.length === 0) return;

    isSyncingRoomStatusRef.current = true;
    (async () => {
      try {
        const results = await Promise.all(
          staleStatusUpdates.map(({ id, updates }) =>
            supabase.from("rooms").update(updates).eq("id", id)
          )
        );

        const errorResult = results.find((result) => result.error);
        if (errorResult?.error) {
          console.error("Room status sync failed:", errorResult.error);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["rooms"] });
      } finally {
        isSyncingRoomStatusRef.current = false;
      }
    })();
  }, [bookingsByRoom, dbRooms, queryClient]);

  const rooms = useMemo(() => {
    if (!dbRooms) return [];

    return dbRooms.map((room) => {
      const roomBookings = bookingsByRoom.get(room.number) || [];
      const checkedInBooking = roomBookings.find((booking) => booking.status === "checked-in");
      const reservedBooking = roomBookings.find((booking) =>
        ["pre-arrival", "confirmed", "reserved"].includes(booking.status)
      );
      const checkedOutBooking = roomBookings.find((booking) => booking.status === "checked-out");
      const displayBooking = checkedInBooking || reservedBooking || checkedOutBooking || roomBookings[0];
      const guestName = displayBooking?.guest_id ? guestLookup.get(displayBooking.guest_id) : undefined;
      const baseRoom = mapToLegacyRoom(room);

      let effectiveOccupancy = baseRoom.occupancyStatus;
      if (checkedInBooking) {
        effectiveOccupancy = "occupied";
      } else if (reservedBooking) {
        effectiveOccupancy = "reserved";
      } else if (effectiveOccupancy === "occupied") {
        effectiveOccupancy = checkedOutBooking ? "checkout" : "vacant";
      } else if (effectiveOccupancy === "reserved" && !reservedBooking) {
        effectiveOccupancy = checkedOutBooking ? "checkout" : "vacant";
      }

      return {
        ...baseRoom,
        occupancyStatus: effectiveOccupancy,
        currentGuest:
          guestName ||
          (effectiveOccupancy === "occupied" || effectiveOccupancy === "reserved"
            ? room.current_guest_id
              ? "Guest"
              : undefined
            : undefined),
        checkInDate: displayBooking?.check_in,
        checkOutDate: displayBooking?.check_out,
      };
    });
  }, [bookingsByRoom, dbRooms, guestLookup]);

  const roomCounts = useMemo(() => {
    const counts = {
      all: rooms.length,
      vacant: 0,
      occupied: 0,
      checkout: 0,
      reserved: 0,
    };

    rooms.forEach((room) => {
      counts[room.occupancyStatus] += 1;
    });

    return counts;
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const query = roomSearchTerm.trim().toLowerCase();

    return rooms.filter((room) => {
      const statusMatch = occupancyFilter === "all" || room.occupancyStatus === occupancyFilter;
      if (!statusMatch) return false;

      if (!query) return true;

      const roomNumber = room.number.toLowerCase();
      const searchTargets = [
        roomNumber,
        `room ${roomNumber}`,
        room.name.toLowerCase(),
        room.type.toLowerCase(),
        (room.currentGuest || "").toLowerCase(),
      ];

      return searchTargets.some((target) => target.includes(query));
    });
  }, [rooms, roomSearchTerm, occupancyFilter]);

  const applyRoomSearch = () => {
    setRoomSearchTerm(roomSearchInput);
  };

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
            <Button size="sm" className="gap-2" onClick={() => setAddRoomOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search by room number, name, type, or guest..."
              value={roomSearchInput}
              onChange={(event) => setRoomSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyRoomSearch();
                }
              }}
            />
            <Button variant="outline" className="gap-2 sm:w-auto w-full" onClick={applyRoomSearch}>
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={occupancyFilter === "all" ? "default" : "outline"}
              onClick={() => setOccupancyFilter("all")}
            >
              All ({roomCounts.all})
            </Button>
            <Button
              size="sm"
              variant={occupancyFilter === "occupied" ? "default" : "outline"}
              onClick={() => setOccupancyFilter("occupied")}
            >
              Occupied ({roomCounts.occupied})
            </Button>
            <Button
              size="sm"
              variant={occupancyFilter === "checkout" ? "default" : "outline"}
              onClick={() => setOccupancyFilter("checkout")}
            >
              Checkout ({roomCounts.checkout})
            </Button>
            <Button
              size="sm"
              variant={occupancyFilter === "reserved" ? "default" : "outline"}
              onClick={() => setOccupancyFilter("reserved")}
            >
              Reserved ({roomCounts.reserved})
            </Button>
            <Button
              size="sm"
              variant={occupancyFilter === "vacant" ? "default" : "outline"}
              onClick={() => setOccupancyFilter("vacant")}
            >
              Vacant ({roomCounts.vacant})
            </Button>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={setViewMode}>
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
            {filteredRooms.length > 0 ? (
              <RoomGrid rooms={filteredRooms} onRoomClick={handleRoomClick} />
            ) : (
              <div className="text-center py-12 text-muted-foreground border rounded-xl">
                No rooms found for the current search/filter.
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            {filteredRooms.length > 0 ? (
              <AvailabilityCalendar
                rooms={filteredRooms}
                bookings={bookings}
                guests={guests}
                startDate={calendarStart}
                daysToShow={14}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground border rounded-xl">
                No rooms available for the selected filters.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <RoomDetailModal 
        room={selectedRoom}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdateStatus={handleUpdateRoom}
      />

      <AddRoomModal open={addRoomOpen} onOpenChange={setAddRoomOpen} />
    </MainLayout>
  );
};

export default Rooms;
