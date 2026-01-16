import { Room } from "@/types/room";
import { RoomCard } from "./RoomCard";

interface RoomGridProps {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
}

export function RoomGrid({ rooms, onRoomClick }: RoomGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rooms.map((room, index) => (
        <div 
          key={room.id} 
          style={{ animationDelay: `${index * 50}ms` }}
          className="animate-fade-in"
        >
          <RoomCard room={room} onClick={() => onRoomClick?.(room)} />
        </div>
      ))}
    </div>
  );
}
