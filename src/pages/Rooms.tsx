import { MainLayout } from "@/components/layout/MainLayout";
import { RoomGrid } from "@/components/dashboard/RoomGrid";
import { mockRooms } from "@/data/mockRooms";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";

const Rooms = () => {
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
        <RoomGrid rooms={mockRooms} />
      </div>
    </MainLayout>
  );
};

export default Rooms;
