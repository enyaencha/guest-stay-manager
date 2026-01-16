import { Room } from "@/types/room";
import { cn } from "@/lib/utils";
import { 
  BedDouble, 
  Users, 
  Sparkles, 
  Wrench, 
  LogOut,
  Wifi,
  Wind,
  Tv,
  UtensilsCrossed
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
}

const roomTypeIcons = {
  single: BedDouble,
  double: BedDouble,
  suite: BedDouble,
  villa: BedDouble,
  apartment: BedDouble,
};

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  ac: Wind,
  tv: Tv,
  kitchen: UtensilsCrossed,
};

export function RoomCard({ room, onClick }: RoomCardProps) {
  const getOccupancyStatus = () => {
    switch (room.occupancyStatus) {
      case 'occupied':
        return { label: 'Occupied', class: 'status-occupied' };
      case 'vacant':
        return { label: 'Vacant', class: 'status-available' };
      case 'checkout':
        return { label: 'Checkout', class: 'status-checkout' };
    }
  };

  const getCleaningStatus = () => {
    switch (room.cleaningStatus) {
      case 'clean':
        return null;
      case 'dirty':
        return { label: 'Needs Cleaning', icon: Sparkles, class: 'status-cleaning' };
      case 'in-progress':
        return { label: 'Cleaning', icon: Sparkles, class: 'status-cleaning animate-pulse-soft' };
    }
  };

  const getMaintenanceStatus = () => {
    if (room.maintenanceStatus === 'none') return null;
    return { 
      label: room.maintenanceStatus === 'pending' ? 'Maintenance Needed' : 'In Repair', 
      icon: Wrench, 
      class: 'status-maintenance' 
    };
  };

  const occupancy = getOccupancyStatus();
  const cleaning = getCleaningStatus();
  const maintenance = getMaintenanceStatus();
  const RoomIcon = roomTypeIcons[room.type];

  const displayedAmenities = room.amenities.slice(0, 4);

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative bg-card rounded-xl border p-4 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer animate-fade-in",
        maintenance && "border-status-maintenance/30",
        cleaning && !maintenance && "border-status-cleaning/30"
      )}
    >
      {/* Room Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <RoomIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Room {room.number}</h3>
            <p className="text-xs text-muted-foreground capitalize">{room.type}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs border", occupancy.class)}>
          {occupancy.label}
        </Badge>
      </div>

      {/* Room Name */}
      <p className="text-sm text-muted-foreground mb-3 truncate">{room.name}</p>

      {/* Guest Info (if occupied) */}
      {room.occupancyStatus !== 'vacant' && room.currentGuest && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{room.currentGuest}</p>
            {room.checkOutDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <LogOut className="h-3 w-3" />
                Out: {new Date(room.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {cleaning && (
          <Badge variant="outline" className={cn("text-xs border gap-1", cleaning.class)}>
            <cleaning.icon className="h-3 w-3" />
            {cleaning.label}
          </Badge>
        )}
        {maintenance && (
          <Badge variant="outline" className={cn("text-xs border gap-1", maintenance.class)}>
            <maintenance.icon className="h-3 w-3" />
            {maintenance.label}
          </Badge>
        )}
      </div>

      {/* Amenities */}
      <div className="flex items-center gap-2 pt-2 border-t">
        {displayedAmenities.map((amenity) => {
          const Icon = amenityIcons[amenity];
          return Icon ? (
            <div key={amenity} className="p-1.5 rounded bg-muted/50" title={amenity}>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          ) : null;
        })}
        {room.amenities.length > 4 && (
          <span className="text-xs text-muted-foreground">+{room.amenities.length - 4}</span>
        )}
        <div className="ml-auto text-right">
          <p className="text-sm font-semibold">${room.basePrice}</p>
          <p className="text-xs text-muted-foreground">/night</p>
        </div>
      </div>
    </div>
  );
}
