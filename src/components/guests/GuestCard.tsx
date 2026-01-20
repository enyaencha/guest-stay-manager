import { useState } from "react";
import { Guest } from "@/types/guest";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatKsh } from "@/lib/formatters";
import { format } from "date-fns";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Users, 
  CreditCard,
  MoreVertical,
  Eye,
  MessageSquare,
  Receipt,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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
  const [showDetails, setShowDetails] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const status = statusConfig[guest.status];
  const paidAmount = guest.paidAmount ?? 0;
  const totalAmount = guest.totalAmount ?? 0;
  const guestCount = guest.guests ?? 1;
  const paymentStatus = paidAmount >= totalAmount ? "Paid" : "Partial";
  const paymentColor = paymentStatus === "Paid" 
    ? "bg-status-available/20 text-status-available" 
    : "bg-status-checkout/20 text-status-checkout";

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setIsSending(true);
    // Simulate sending message
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`Message sent to ${guest.name}`);
    setMessage("");
    setShowMessage(false);
    setIsSending(false);
  };

  return (
    <>
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
                  <DropdownMenuItem onClick={() => setShowDetails(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowMessage(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBilling(true)}>
                    <Receipt className="h-4 w-4 mr-2" />
                    View Billing
                  </DropdownMenuItem>
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
              <span>{guestCount} Guest{guestCount > 1 ? "s" : ""}</span>
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
                {formatKsh(paidAmount)} / {formatKsh(totalAmount)}
              </span>
            </div>
            <Badge className={paymentColor}>{paymentStatus}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Guest Details</DialogTitle>
            <DialogDescription>Complete information for {guest.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{guest.name}</h3>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium">Room {guest.roomNumber} ({guest.roomType})</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Email</span>
                <span>{guest.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Phone</span>
                <span>{guest.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Check-in</span>
                <span>{guest.checkIn}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Check-out</span>
                <span>{guest.checkOut}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Guests</span>
                <span>{guestCount}</span>
              </div>
              {guest.specialRequests && (
                <div className="py-2">
                  <span className="text-muted-foreground block mb-1">Special Requests</span>
                  <p className="bg-muted/50 rounded p-2 text-sm">{guest.specialRequests}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessage} onOpenChange={setShowMessage}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message to Guest</DialogTitle>
            <DialogDescription>Send a message to {guest.name} ({guest.phone})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMessage(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Billing Dialog */}
      <Dialog open={showBilling} onOpenChange={setShowBilling}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Billing Details</DialogTitle>
            <DialogDescription>Payment information for {guest.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Room {guest.roomNumber}</span>
                <Badge className={status.className}>{status.label}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Room Type</span>
                  <span className="capitalize">{guest.roomType}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Stay Period</span>
                  <span>{guest.checkIn} - {guest.checkOut}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">{formatKsh(totalAmount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Paid Amount</span>
                  <span className="font-medium text-status-available">{formatKsh(paidAmount)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Balance</span>
                  <span className={`font-semibold ${totalAmount - paidAmount > 0 ? 'text-status-maintenance' : 'text-status-available'}`}>
                    {formatKsh(totalAmount - paidAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Payment Status</span>
              <Badge className={paymentColor}>{paymentStatus}</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
