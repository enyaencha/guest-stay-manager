import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { 
  User, 
  Phone, 
  Mail,
  Calendar, 
  BedDouble, 
  Users,
  MessageSquare,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";

interface ReservationRequest {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  source: string | null;
  request_items: Array<{
    room_type: string;
    package?: string | null;
    rooms_count: number;
    guests_count: number;
    check_in: string;
    check_out: string;
  }>;
  special_requests: string | null;
  status: string;
  created_at: string;
}

interface ReservationCardProps {
  reservation: ReservationRequest;
  onStatusChange: (id: string, status: string, note?: string) => Promise<void>;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  confirmed: { label: "Confirmed", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelled", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function ReservationCard({ reservation, onStatusChange }: ReservationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const status = statusConfig[reservation.status] || { label: reservation.status, class: "bg-muted" };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onStatusChange(reservation.id, "confirmed", note || undefined);
      toast.success("Reservation confirmed successfully");
      setNote("");
      setShowNoteInput(false);
    } catch (error) {
      toast.error("Failed to confirm reservation");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!note.trim()) {
      toast.error("Please provide a reason for cancellation");
      setShowNoteInput(true);
      return;
    }
    setIsProcessing(true);
    try {
      await onStatusChange(reservation.id, "cancelled", note);
      toast.success("Reservation cancelled");
      setNote("");
      setShowNoteInput(false);
    } catch (error) {
      toast.error("Failed to cancel reservation");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalRooms = reservation.request_items.reduce(
    (sum, item) => sum + (Number(item.rooms_count) || 0),
    0
  );
  const totalGuests = reservation.request_items.reduce(
    (sum, item) => sum + (Number(item.guests_count) || 0),
    0
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {reservation.guest_name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {reservation.guest_phone}
            </div>
          </div>
          <Badge className={status.class}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <span>{totalRooms} Room{totalRooms === 1 ? "" : "s"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{totalGuests} Guest{totalGuests === 1 ? "" : "s"}</span>
          </div>
        </div>

        {/* Expandable Details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>Details</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div className="space-y-3 pt-2 border-t">
            {reservation.guest_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.guest_email}</span>
              </div>
            )}

            {reservation.source && (
              <div className="text-sm">
                <span className="text-muted-foreground">Source:</span>{' '}
                <span>{reservation.source}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Requested Stay Details
              </div>
              <div className="space-y-2">
                {reservation.request_items.map((item, index) => (
                  <div key={index} className="rounded-md border p-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{item.room_type}</span>
                      <span className="text-muted-foreground">
                        {item.rooms_count} room{item.rooms_count > 1 ? "s" : ""} • {item.guests_count} guest
                        {item.guests_count > 1 ? "s" : ""}
                      </span>
                    </div>
                    {item.package && (
                      <div className="text-xs text-muted-foreground">Package: {item.package}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(item.check_in), "MMM d, yyyy HH:mm")} →{" "}
                      {format(new Date(item.check_out), "MMM d, yyyy HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {reservation.special_requests && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  Special Requests
                </div>
                <p className="text-sm bg-muted/50 p-2 rounded">{reservation.special_requests}</p>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Requested: {format(new Date(reservation.created_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
        )}

        {/* Note Input */}
        {showNoteInput && reservation.status === "pending" && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note (required for cancellation)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        )}

        {/* Actions */}
        {reservation.status === "pending" && (
          <div className="flex gap-2 pt-2">
            {!showNoteInput ? (
              <>
                <Button
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Confirm
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNoteInput(true)}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={isProcessing || !note.trim()}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm Cancel"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNoteInput(false);
                    setNote("");
                  }}
                  disabled={isProcessing}
                >
                  Back
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
