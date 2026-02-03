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

const roomTypeImages: Record<string, string> = {
  single: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=2400&h=1600&fit=crop",
  double: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=2400&h=1600&fit=crop",
  suite: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=2400&h=1600&fit=crop",
  villa: "https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=2400&h=1600&fit=crop",
  apartment: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=2400&h=1600&fit=crop",
};

export function RoomCard({ room, onClick }: RoomCardProps) {
  const statusStyles: Record<string, string> = {
    vacant: "border-status-available/70 bg-status-available-bg/70 text-foreground",
    occupied: "border-status-occupied/70 bg-[hsl(var(--status-occupied-bg))]/70 text-foreground",
    checkout: "border-status-checkout/70 bg-[hsl(var(--status-checkout-bg))]/70 text-foreground",
    reserved: "border-status-reserved/80 bg-[hsl(var(--status-reserved-bg))]/80 text-foreground ring-1 ring-status-reserved/30",
  };

  const stripStyles: Record<string, string> = {
    vacant: "bg-status-available",
    occupied: "bg-status-occupied",
    checkout: "bg-status-checkout",
    reserved: "bg-status-reserved",
  };

  const priorityBorder = room.maintenanceStatus !== "none"
    ? "border-status-maintenance/80 ring-1 ring-status-maintenance/30 bg-status-maintenance/15 text-foreground"
    : room.cleaningStatus !== "clean"
      ? "border-status-cleaning/80 ring-1 ring-status-cleaning/30 bg-status-cleaning/15 text-foreground"
      : statusStyles[room.occupancyStatus];

  const stripClass = room.maintenanceStatus !== "none"
    ? "bg-status-maintenance"
    : room.cleaningStatus !== "clean"
      ? "bg-status-cleaning"
      : stripStyles[room.occupancyStatus];

  const getOccupancyStatus = () => {
    switch (room.occupancyStatus) {
      case 'occupied':
        return { label: 'Occupied', class: 'status-occupied' };
      case 'vacant':
        return { label: 'Vacant', class: 'status-available' };
      case 'checkout':
        return { label: 'Checkout', class: 'status-checkout' };
      case 'reserved':
        return { label: 'Reserved', class: 'status-reserved' };
      default:
        return { label: 'Unknown', class: 'status-available' };
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
        "group relative rounded-xl border p-4 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer animate-fade-in",
        priorityBorder
      )}
    >
      <div className={cn("absolute left-0 top-0 h-1.5 w-full rounded-t-xl", stripClass)} />
      <div className="relative z-10">
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

      {/* Guest Info (if occupied or reserved) */}
      {(room.occupancyStatus === 'occupied' || room.occupancyStatus === 'reserved') && room.currentGuest && (
        <div className={cn(
          "flex items-center gap-2 mb-3 p-2 rounded-lg",
          room.occupancyStatus === 'reserved' ? "bg-[hsl(var(--status-reserved-bg))]" : "bg-muted/50"
        )}>
          <Users className={cn(
            "h-4 w-4",
            room.occupancyStatus === 'reserved' ? "text-[hsl(var(--status-reserved))]" : "text-muted-foreground"
          )} />
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
          <p className="text-sm font-semibold">Ksh {room.basePrice}</p>
          <p className="text-xs text-muted-foreground">/night</p>
        </div>
      </div>
      </div>
    </div>
  );
}
