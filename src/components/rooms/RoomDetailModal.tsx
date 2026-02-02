import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Room } from "@/types/room";
import { formatKsh } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBookings, useGuests } from "@/hooks/useGuests";
import { useMaintenanceIssues } from "@/hooks/useMaintenance";
import { ReportIssueModal } from "@/components/maintenance/ReportIssueModal";
import { AddHousekeepingTaskModal } from "@/components/housekeeping/AddHousekeepingTaskModal";
import { RefundRequestModal } from "@/components/refunds/RefundRequestModal";
import { RoomAssessmentModal } from "@/components/checkout/RoomAssessmentModal";
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
  History,
  AlertTriangle,
  ClipboardList
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useMemo, useState, useEffect, useRef } from "react";

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

export function RoomDetailModal({ room, open, onOpenChange, onUpdateStatus }: RoomDetailModalProps) {
  const { data: bookings = [] } = useBookings();
  const { data: guests = [] } = useGuests();
  const { data: maintenanceIssues = [] } = useMaintenanceIssues();
  const [reportOpen, setReportOpen] = useState(false);
  const [housekeepingOpen, setHousekeepingOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const autoOpenTriggeredRef = useRef(false);

  const guestLookup = useMemo(() => {
    return new Map(guests.map((guest) => [guest.id, guest.name]));
  }, [guests]);

  const roomBookings = useMemo(() => {
    if (!room) return [];
    return bookings
      .filter((booking) => {
        const numberMatch = booking.room_number === room.number;
        const typeMatch = booking.room_type?.toLowerCase() === room.name.toLowerCase();
        return numberMatch || typeMatch;
      })
      .sort((a, b) => parseISO(b.check_in).getTime() - parseISO(a.check_in).getTime());
  }, [bookings, room]);

  const historyEntries = useMemo(() => {
    if (!room) return [];
    return roomBookings
      .slice(0, 6)
      .map((booking) => ({
        date: booking.check_out || booking.check_in,
        guest: booking.guest_id ? guestLookup.get(booking.guest_id) || "Guest" : "Guest",
        action: booking.status ? booking.status.replace(/-/g, " ") : "Booking",
        amount: booking.total_amount || 0,
      }));
  }, [roomBookings, guestLookup, room]);

  const latestBooking = roomBookings[0];
  const latestGuestName = latestBooking?.guest_id ? guestLookup.get(latestBooking.guest_id) || "Guest" : "Guest";

  const roomIssues = useMemo(() => {
    if (!room) return [];
    return maintenanceIssues
      .filter((issue) => {
        const numberMatch = issue.room_number === room.number;
        const idMatch = issue.room_id && issue.room_id === room.id;
        const nameMatch = issue.room_name && issue.room_name.toLowerCase() === room.name.toLowerCase();
        return numberMatch || idMatch || nameMatch;
      })
      .sort((a, b) => parseISO(b.reported_at).getTime() - parseISO(a.reported_at).getTime());
  }, [maintenanceIssues, room]);

  useEffect(() => {
    if (!room || !open) {
      autoOpenTriggeredRef.current = false;
      return;
    }
    if (autoOpenTriggeredRef.current) return;

    if (room.maintenanceStatus !== "none") {
      setReportOpen(true);
      autoOpenTriggeredRef.current = true;
      return;
    }
    if (room.cleaningStatus !== "clean") {
      setHousekeepingOpen(true);
      autoOpenTriggeredRef.current = true;
    }
  }, [open, room?.maintenanceStatus, room?.cleaningStatus, room]);

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
    inspecting: { label: 'Inspecting', class: 'status-cleaning' },
  };

  const maintenanceConfig = {
    none: { label: 'No Issues', class: 'status-available' },
    pending: { label: 'Issue Reported', class: 'status-maintenance' },
    'in-progress': { label: 'Repair In Progress', class: 'status-maintenance' },
  };

  const issueStatusConfig: Record<string, { label: string; class: string }> = {
    open: { label: 'Open', class: 'status-maintenance' },
    'in-progress': { label: 'In Progress', class: 'status-cleaning' },
    resolved: { label: 'Resolved', class: 'status-available' },
    closed: { label: 'Closed', class: 'status-available' },
    cancelled: { label: 'Cancelled', class: 'status-checkout' },
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
              <TabsTrigger value="alerts" className="flex-1">Alerts</TabsTrigger>
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

            <TabsContent value="alerts" className="space-y-4 mt-4">
              <div className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-status-maintenance" />
                  <h4 className="font-medium">Attention Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span>Cleaning</span>
                    <Badge className={cn("border", cleaningConfig[room.cleaningStatus].class)}>
                      {cleaningConfig[room.cleaningStatus].label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <span>Maintenance</span>
                    <Badge className={cn("border", maintenanceConfig[room.maintenanceStatus].class)}>
                      {maintenanceConfig[room.maintenanceStatus].label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reported Issues</span>
                  <Badge variant="secondary">{roomIssues.length}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  Latest Issues
                </div>
                {roomIssues.length > 0 ? (
                  roomIssues.slice(0, 3).map((issue) => {
                    const status = issueStatusConfig[issue.status] || issueStatusConfig.open;
                    return (
                      <div key={issue.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{issue.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {issue.category} • {issue.priority} priority
                            </p>
                          </div>
                          <Badge className={cn("border", status.class)}>{status.label}</Badge>
                        </div>
                        {issue.description && (
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Reported {format(parseISO(issue.reported_at), 'MMM d, h:mm a')}</span>
                          {issue.assigned_to_name && <span>Assigned to {issue.assigned_to_name}</span>}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">No issues reported for this room.</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-3">
                {historyEntries.length > 0 ? (
                  historyEntries.map((entry, index) => (
                    <div key={`${entry.date}-${index}`} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <History className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{entry.guest}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.action} • {entry.date}
                          </p>
                        </div>
                      </div>
                      {entry.amount > 0 && (
                        <span className="text-sm font-medium">{formatKsh(entry.amount)}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No booking history available.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {room.occupancyStatus === 'vacant' && room.cleaningStatus === 'clean' && (
              <Button className="flex-1">Create Booking</Button>
            )}
            {room.occupancyStatus === 'occupied' && (
              <Button variant="outline" className="flex-1" onClick={() => setAssessmentOpen(true)}>
                Process Checkout
              </Button>
            )}
            {latestBooking && latestBooking.guest_id && (
              <Button variant="outline" className="flex-1" onClick={() => setRefundOpen(true)}>
                Request Refund
              </Button>
            )}
            <Button variant="outline" onClick={() => setHousekeepingOpen(true)}>
              Create Housekeeping Task
            </Button>
            <Button variant="outline" onClick={() => setReportOpen(true)}>
              Report Issue
            </Button>
          </div>
        </div>
      </DialogContent>

      <ReportIssueModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        initialRoomId={room.id}
        onIssueCreated={(roomId) => {
          if (room.maintenanceStatus === "none") {
            onUpdateStatus?.(roomId, { maintenanceStatus: "pending" });
          }
        }}
      />

      <AddHousekeepingTaskModal
        open={housekeepingOpen}
        onOpenChange={setHousekeepingOpen}
        initialRoomId={room.id}
        initialTaskType={room.occupancyStatus === "checkout" ? "checkout-clean" : "daily-clean"}
        initialPriority={room.cleaningStatus === "dirty" ? "high" : "normal"}
        onTaskCreated={(roomId) => {
          if (room.cleaningStatus === "clean") {
            onUpdateStatus?.(roomId, { cleaningStatus: "dirty" });
          }
        }}
      />

      {latestBooking && latestBooking.guest_id && (
        <>
          <RoomAssessmentModal
            open={assessmentOpen}
            onOpenChange={setAssessmentOpen}
            bookingId={latestBooking.id}
            guestId={latestBooking.guest_id}
            guestName={latestGuestName}
            roomNumber={room.number}
          />
          <RefundRequestModal
            open={refundOpen}
            onOpenChange={setRefundOpen}
            bookingId={latestBooking.id}
            guestId={latestBooking.guest_id}
            guestName={latestGuestName}
            roomNumber={room.number}
            amountPaid={latestBooking.paid_amount || latestBooking.total_amount || 0}
          />
        </>
      )}
    </Dialog>
  );
}
