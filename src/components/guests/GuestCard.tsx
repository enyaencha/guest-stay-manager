import { Guest } from "@/types/guest";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKsh } from "@/lib/formatters";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DoorOpen, 
  Users, 
  CreditCard,
  MoreVertical 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GuestCardProps {
  guest: Guest;
  onCheckIn?: (id: string) => void;
  onCheckOut?: (id: string) => void;
}

const statusConfig: Record<Guest["status"], { label: string; className: string }> = {
  "pre-arrival": { label: "Pre-Arrival", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  "checked-in": { label: "Checked In", className: "bg-status-occupied/20 text-status-occupied" },
  "checked-out": { label: "Checked Out", className: "bg-muted text-muted-foreground" },
  "no-show": { label: "No Show", className: "bg-status-maintenance/20 text-status-maintenance" },
  "cancelled": { label: "Cancelled", className: "bg-destructive/20 text-destructive" },
};

export const GuestCard = ({ guest, onCheckIn, onCheckOut }: GuestCardProps) => {
  const status = statusConfig[guest.status];
  const paymentStatus = guest.paidAmount >= guest.totalAmount ? "Paid" : "Partial";
  const paymentColor = paymentStatus === "Paid" 
    ? "bg-status-available/20 text-status-available" 
    : "bg-status-checkout/20 text-status-checkout";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{guest.name}</h3>
              <p className="text-sm text-muted-foreground">Room {guest.roomNumber} • {guest.roomType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={status.className}>{status.label}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {guest.status === "pre-arrival" && (
                  <DropdownMenuItem onClick={() => onCheckIn?.(guest.id)}>
                    Check In Guest
                  </DropdownMenuItem>
                )}
                {guest.status === "checked-in" && (
                  <DropdownMenuItem onClick={() => onCheckOut?.(guest.id)}>
                    Check Out Guest
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Send Message</DropdownMenuItem>
                <DropdownMenuItem>View Billing</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{guest.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{guest.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{guest.checkIn} → {guest.checkOut}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{guest.guests} Guest{guest.guests > 1 ? "s" : ""}</span>
          </div>
        </div>

        {guest.specialRequests && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2 mb-3">
            📝 {guest.specialRequests}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {formatKsh(guest.paidAmount)} / {formatKsh(guest.totalAmount)}
            </span>
          </div>
          <Badge className={paymentColor}>{paymentStatus}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
