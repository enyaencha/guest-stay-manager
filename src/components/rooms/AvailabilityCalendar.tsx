import { useMemo } from "react";
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { mockRooms } from "@/data/mockRooms";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AvailabilityCalendarProps {
  startDate?: Date;
  daysToShow?: number;
}

export function AvailabilityCalendar({ 
  startDate = new Date(), 
  daysToShow = 14 
}: AvailabilityCalendarProps) {
  const dates = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, daysToShow - 1)
    });
  }, [startDate, daysToShow]);

  const roomsWithBookings = useMemo(() => {
    return mockRooms.map(room => {
      const hasBooking = room.checkInDate && room.checkOutDate;
      return {
        ...room,
        bookingStart: hasBooking ? parseISO(room.checkInDate!) : null,
        bookingEnd: hasBooking ? parseISO(room.checkOutDate!) : null,
      };
    });
  }, []);

  const isDateBooked = (room: typeof roomsWithBookings[0], date: Date) => {
    if (!room.bookingStart || !room.bookingEnd) return false;
    return isWithinInterval(date, { start: room.bookingStart, end: room.bookingEnd });
  };

  const getBookingStyle = (room: typeof roomsWithBookings[0], date: Date) => {
    if (!room.bookingStart || !room.bookingEnd) return null;
    
    const isStart = isSameDay(date, room.bookingStart);
    const isEnd = isSameDay(date, room.bookingEnd);
    const isMiddle = isDateBooked(room, date) && !isStart && !isEnd;

    if (isStart) return "rounded-l-md bg-status-occupied text-white";
    if (isEnd) return "rounded-r-md bg-status-occupied/70 text-white";
    if (isMiddle) return "bg-status-occupied/50";
    return null;
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-sm sticky left-0 bg-muted/50 z-10 min-w-[150px]">
                Room
              </th>
              {dates.map((date) => (
                <th 
                  key={date.toISOString()} 
                  className={cn(
                    "p-2 text-center min-w-[50px]",
                    isSameDay(date, new Date()) && "bg-accent/10"
                  )}
                >
                  <div className="text-xs text-muted-foreground">{format(date, 'EEE')}</div>
                  <div className={cn(
                    "text-sm font-medium",
                    isSameDay(date, new Date()) && "text-accent"
                  )}>
                    {format(date, 'd')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roomsWithBookings.map((room) => (
              <tr key={room.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 sticky left-0 bg-card z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{room.number}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {room.type}
                    </Badge>
                  </div>
                </td>
                {dates.map((date) => {
                  const style = getBookingStyle(room, date);
                  const isBooked = isDateBooked(room, date);
                  
                  return (
                    <td 
                      key={date.toISOString()} 
                      className={cn(
                        "p-1 text-center",
                        isSameDay(date, new Date()) && "bg-accent/5"
                      )}
                    >
                      <div 
                        className={cn(
                          "h-8 flex items-center justify-center text-xs",
                          style,
                          !isBooked && "hover:bg-status-available/20 cursor-pointer rounded"
                        )}
                      >
                        {isSameDay(date, room.bookingStart!) && room.currentGuest && (
                          <span className="truncate px-1 text-xs">
                            {room.currentGuest}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-3 border-t bg-muted/30 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-status-occupied" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-dashed border-muted-foreground/30" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent/20 border border-accent" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
