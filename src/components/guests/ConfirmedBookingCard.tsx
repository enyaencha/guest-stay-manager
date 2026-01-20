import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKsh } from "@/lib/formatters";
import { format } from "date-fns";
import { 
  User, 
  Phone, 
  Calendar, 
  BedDouble, 
  Users,
  DoorOpen
} from "lucide-react";

interface ConfirmedBooking {
  id: string;
  guest_id: string | null;
  guest_name: string;
  guest_phone: string;
  room_type: string;
  room_number: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  special_requests: string | null;
}

interface ConfirmedBookingCardProps {
  booking: ConfirmedBooking;
  onAssignRoom: (booking: ConfirmedBooking) => void;
}

export function ConfirmedBookingCard({ booking, onAssignRoom }: ConfirmedBookingCardProps) {
  const isToday = new Date(booking.check_in).toDateString() === new Date().toDateString();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-status-reserved/10">
              <User className="h-5 w-5 text-[hsl(var(--status-reserved))]" />
            </div>
            <div>
              <h3 className="font-semibold">{booking.guest_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                {booking.guest_phone}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className="status-reserved">Confirmed</Badge>
            {isToday && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Arriving Today
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="h-4 w-4" />
            <span className="capitalize">{booking.room_type}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{booking.guests_count} Guest{booking.guests_count > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(booking.check_in), "MMM d")} - {format(new Date(booking.check_out), "MMM d, yyyy")}
          </span>
        </div>

        {booking.special_requests && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2 mb-3">
            📝 {booking.special_requests}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="font-medium">{formatKsh(booking.total_amount)}</span>
          <Button size="sm" onClick={() => onAssignRoom(booking)}>
            <DoorOpen className="h-4 w-4 mr-1" />
            Assign Room & Check In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
