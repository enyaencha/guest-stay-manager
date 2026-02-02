import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Search, 
  Calendar, 
  BedDouble, 
  Users, 
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone
} from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  special_requests: string | null;
  created_at: string;
}

interface BookingLookupRow {
  guest_id: string;
  guest_name: string;
  booking_id: string;
  room_number: string;
  room_type: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  special_requests: string | null;
  created_at: string;
}

interface ReservationLookupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReservationLookupModal = ({ open, onOpenChange }: ReservationLookupModalProps) => {
  const [phone, setPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmed', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' };
      case 'reserved':
        return { label: 'Pending Confirmation', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' };
      case 'checked-in':
        return { label: 'Checked In', variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' };
      case 'checked-out':
        return { label: 'Completed', variant: 'outline' as const, icon: CheckCircle, color: 'text-gray-600' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' };
      default:
        return { label: status, variant: 'secondary' as const, icon: AlertCircle, color: 'text-gray-600' };
    }
  };

  const handleSearch = async () => {
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsSearching(true);
    setBookings(null);

    try {
      const { data: rows, error: lookupError } = await supabase
        .rpc("lookup_bookings_by_phone", { phone_input: phone });

      if (lookupError || !rows || rows.length === 0) {
        toast.error("No bookings found for this phone number");
        setIsSearching(false);
        return;
      }

      const typedRows = rows as BookingLookupRow[];
      setGuestName(typedRows[0].guest_name);
      setBookings(
        typedRows.map((row) => ({
          id: row.booking_id,
          room_number: row.room_number,
          room_type: row.room_type,
          check_in: row.check_in,
          check_out: row.check_out,
          guests_count: row.guests_count,
          total_amount: row.total_amount,
          paid_amount: row.paid_amount,
          status: row.status,
          special_requests: row.special_requests,
          created_at: row.created_at,
        }))
      );
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Failed to find bookings");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setPhone("");
    setBookings(null);
    setGuestName(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check Booking Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Enter your phone number</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {guestName && bookings && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  Welcome back, <strong>{guestName}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  {bookings.length} booking{bookings.length > 1 ? 's' : ''} found
                </p>
              </div>

              {bookings.map((booking) => {
                const statusConfig = getStatusConfig(booking.status);
                const StatusIcon = statusConfig.icon;
                const balance = booking.total_amount - booking.paid_amount;

                return (
                  <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-muted-foreground">
                        #{booking.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge variant={statusConfig.variant} className="gap-1">
                        <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Check-in</p>
                          <p className="font-medium">{format(new Date(booking.check_in), "MMM dd, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Check-out</p>
                          <p className="font-medium">{format(new Date(booking.check_out), "MMM dd, yyyy")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Room</p>
                          <p className="font-medium capitalize">{booking.room_type} ({booking.room_number})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Guests</p>
                          <p className="font-medium">{booking.guests_count}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          Total
                        </span>
                        <span className="font-semibold">Ksh {booking.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Paid</span>
                        <span className="text-green-600">Ksh {booking.paid_amount.toLocaleString()}</span>
                      </div>
                      {balance > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Balance</span>
                          <span className="text-orange-600 font-medium">Ksh {balance.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {booking.special_requests && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>Special Requests:</strong> {booking.special_requests}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
