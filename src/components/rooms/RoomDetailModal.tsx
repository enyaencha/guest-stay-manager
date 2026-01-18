import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Room } from "@/types/room";
import { formatKsh } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  BedDouble, 
  Users, 
  Wifi, 
  Tv, 
  Wind, 
  UtensilsCrossed,
  Waves,
  Coffee,
  Car,
  Dumbbell,
  Sparkles,
  Wrench,
  Calendar,
  User,
  Clock,
  History
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface RoomDetailModalProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (roomId: string, updates: Partial<Room>) => void;
}

const amenityIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  tv: Tv,
  ac: Wind,
  kitchen: UtensilsCrossed,
  jacuzzi: Waves,
  minibar: Coffee,
  parking: Car,
  gym: Dumbbell,
};

const mockHistory = [
  { date: '2025-01-10', guest: 'John Doe', action: 'Checked out', amount: 12000 },
  { date: '2025-01-05', guest: 'Jane Smith', action: 'Checked out', amount: 8500 },
  { date: '2024-12-28', guest: 'Mike Brown', action: 'Cancelled', amount: 0 },
  { date: '2024-12-20', guest: 'Sarah Wilson', action: 'Checked out', amount: 15000 },
];

export function RoomDetailModal({ room, open, onOpenChange, onUpdateStatus }: RoomDetailModalProps) {
  if (!room) return null;

  const handleStatusChange = (field: 'cleaningStatus' | 'maintenanceStatus', value: string) => {
    onUpdateStatus?.(room.id, { [field]: value });
    toast.success(`Room ${room.number} ${field === 'cleaningStatus' ? 'cleaning' : 'maintenance'} status updated`);
  };

  const statusConfig = {
    vacant: { label: 'Vacant', class: 'status-available' },
    occupied: { label: 'Occupied', class: 'status-occupied' },
    checkout: { label: 'Checkout', class: 'status-checkout' },
  };

  const cleaningConfig = {
    clean: { label: 'Clean', class: 'status-available' },
    dirty: { label: 'Dirty', class: 'status-maintenance' },
    'in-progress': { label: 'Cleaning', class: 'status-cleaning' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Room {room.number}</DialogTitle>
            <Badge className={cn("border", statusConfig[room.occupancyStatus].class)}>
              {statusConfig[room.occupancyStatus].label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Info Header */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
            <div className="p-3 rounded-lg bg-primary/10">
              <BedDouble className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{room.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{room.type} • Floor {room.floor}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Max {room.maxOccupancy} guests</span>
                </div>
                <span className="text-lg font-bold text-primary">{formatKsh(room.basePrice)}/night</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Current Guest */}
              {room.occupancyStatus === 'occupied' && room.currentGuest && (
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Current Guest
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Guest Name</p>
                      <p className="font-medium">{room.currentGuest}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-in</p>
                      <p className="font-medium">{room.checkInDate ? format(parseISO(room.checkInDate), 'PPP') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-out</p>
                      <p className="font-medium">{room.checkOutDate ? format(parseISO(room.checkOutDate), 'PPP') : '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div>
                <h4 className="font-medium mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity] || Coffee;
                    return (
                      <Badge key={amenity} variant="secondary" className="gap-1.5 capitalize">
                        <Icon className="h-3 w-3" />
                        {amenity.replace('-', ' ')}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="status" className="space-y-4 mt-4">
              {/* Quick Status Updates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Cleaning Status
                  </label>
                  <Select
                    value={room.cleaningStatus}
                    onValueChange={(value) => handleStatusChange('cleaningStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Clean</SelectItem>
                      <SelectItem value="dirty">Needs Cleaning</SelectItem>
                      <SelectItem value="in-progress">Cleaning In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Maintenance Status
                  </label>
                  <Select
                    value={room.maintenanceStatus}
                    onValueChange={(value) => handleStatusChange('maintenanceStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Issues</SelectItem>
                      <SelectItem value="pending">Issue Reported</SelectItem>
                      <SelectItem value="in-progress">Repair In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Current Status Summary */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cleaning</span>
                  <Badge className={cn("border", cleaningConfig[room.cleaningStatus].class)}>
                    {cleaningConfig[room.cleaningStatus].label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Maintenance</span>
                  <Badge variant={room.maintenanceStatus === 'none' ? 'secondary' : 'destructive'}>
                    {room.maintenanceStatus === 'none' ? 'No Issues' : room.maintenanceStatus === 'pending' ? 'Issue Pending' : 'In Progress'}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-3">
                {mockHistory.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <History className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{entry.guest}</p>
                        <p className="text-xs text-muted-foreground">{entry.action} • {entry.date}</p>
                      </div>
                    </div>
                    {entry.amount > 0 && (
                      <span className="text-sm font-medium">{formatKsh(entry.amount)}</span>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {room.occupancyStatus === 'vacant' && room.cleaningStatus === 'clean' && (
              <Button className="flex-1">Create Booking</Button>
            )}
            {room.occupancyStatus === 'occupied' && (
              <Button variant="outline" className="flex-1">Process Checkout</Button>
            )}
            <Button variant="outline">Report Issue</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
