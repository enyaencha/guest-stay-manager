import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { AvailabilityCalendar } from "@/components/rooms/AvailabilityCalendar";
import { RoomDetailModal } from "@/components/rooms/RoomDetailModal";
import { mockRooms } from "@/data/mockRooms";
import { Room } from "@/types/room";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, LayoutGrid, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, format } from "date-fns";

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [calendarStart, setCalendarStart] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setModalOpen(true);
  };

  const handleUpdateRoom = (roomId: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => 
      r.id === roomId ? { ...r, ...updates } : r
    ));
  };

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
            <AvailabilityCalendar startDate={calendarStart} daysToShow={14} />
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
