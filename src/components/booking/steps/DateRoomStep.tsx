import { format, differenceInDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookingFormData } from "@/types/booking";
import { useRooms } from "@/hooks/useRooms";
import { formatKsh } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { CalendarIcon, BedDouble, Users, Check, Loader2 } from "lucide-react";

interface DateRoomStepProps {
  formData: BookingFormData;
  updateFormData: (updates: Partial<BookingFormData>) => void;
}

export function DateRoomStep({ formData, updateFormData }: DateRoomStepProps) {
  const { data: rooms = [], isLoading } = useRooms();

  const applyTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map((val) => Number(val));
    const next = new Date(date);
    if (!Number.isNaN(hours)) next.setHours(hours);
    if (!Number.isNaN(minutes)) next.setMinutes(minutes);
    next.setSeconds(0, 0);
    return next;
  };
  
  const availableRooms = rooms.filter(room => 
    room.occupancy_status === 'vacant' && 
    room.cleaning_status === 'clean' &&
    room.maintenance_status === 'none'
  );

  const handleRoomSelect = (room: typeof rooms[0]) => {
    const nights = differenceInDays(formData.checkOut, formData.checkIn);
    const actualNights = nights > 0 ? nights : 1;
    updateFormData({
      roomId: room.id,
      roomType: room.name,
      roomNumber: room.number,
      basePrice: room.base_price,
      nights: actualNights,
      totalAmount: room.base_price * actualNights,
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Check-in Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.checkIn && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.checkIn ? format(formData.checkIn, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.checkIn}
                onSelect={(date) =>
                  date && updateFormData({ checkIn: applyTime(date, formData.checkInTime) })
                }
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Check-out Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.checkOut && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.checkOut ? format(formData.checkOut, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.checkOut}
                onSelect={(date) =>
                  date && updateFormData({ checkOut: applyTime(date, formData.checkOutTime) })
                }
                disabled={(date) => date <= formData.checkIn}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Check-in Time</Label>
          <input
            type="time"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={formData.checkInTime}
            onChange={(e) =>
              updateFormData({
                checkInTime: e.target.value,
                checkIn: applyTime(formData.checkIn, e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Check-out Time</Label>
          <input
            type="time"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={formData.checkOutTime}
            onChange={(e) =>
              updateFormData({
                checkOutTime: e.target.value,
                checkOut: applyTime(formData.checkOut, e.target.value),
              })
            }
          />
        </div>
      </div>

      {formData.nights > 0 && (
        <p className="text-sm text-muted-foreground">
          {formData.nights} night{formData.nights > 1 ? 's' : ''} stay
        </p>
      )}

      {/* Room Selection */}
      <div className="space-y-3">
        <Label>Select Room</Label>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
            {availableRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleRoomSelect(room)}
                className={cn(
                  "relative p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50",
                  formData.roomId === room.id 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-border"
                )}
              >
                {formData.roomId === room.id && (
                  <div className="absolute top-2 right-2 p-1 bg-primary rounded-full">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <BedDouble className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{room.name}</p>
                    <p className="text-sm text-muted-foreground">Room {room.number}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Max {room.max_occupancy}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {formatKsh(room.base_price)}/night
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && availableRooms.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No rooms available for the selected dates
          </div>
        )}
      </div>

      {/* Summary */}
      {formData.roomId && (
        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total for {formData.nights} night{formData.nights > 1 ? 's' : ''}</p>
              <p className="text-lg font-bold">{formatKsh(formData.totalAmount)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
