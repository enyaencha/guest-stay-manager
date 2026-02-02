import { useMemo } from "react";
import { format, addDays, eachDayOfInterval, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Room } from "@/types/room";
import { Booking, Guest } from "@/hooks/useGuests";

interface AvailabilityCalendarProps {
  rooms: Room[];
  bookings: Booking[];
  guests?: Guest[];
  startDate?: Date;
  daysToShow?: number;
}

export function AvailabilityCalendar({ 
  rooms,
  bookings,
  guests = [],
  startDate = new Date(), 
  daysToShow = 14 
}: AvailabilityCalendarProps) {
  const dates = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, daysToShow - 1)
    });
  }, [startDate, daysToShow]);

  const guestLookup = useMemo(() => {
    return new Map(guests.map((guest) => [guest.id, guest.name]));
  }, [guests]);

  const roomsWithBookings = useMemo(() => {
    const rangeStart = dates[0];
    const rangeEnd = dates[dates.length - 1];

    return rooms.map(room => {
      const roomBookings = bookings
        .filter((booking) => {
          const numberMatch = booking.room_number === room.number;
          const typeMatch = booking.room_type?.toLowerCase() === room.name.toLowerCase();
          return numberMatch || typeMatch;
        })
        .map((booking) => ({
          booking,
          start: parseISO(booking.check_in),
          end: parseISO(booking.check_out),
        }))
        .filter(({ start, end }) =>
          isWithinInterval(rangeStart, { start, end }) ||
          isWithinInterval(rangeEnd, { start, end }) ||
          isWithinInterval(start, { start: rangeStart, end: rangeEnd })
        )
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      const activeBooking = roomBookings[0];
      const guestName = activeBooking?.booking.guest_id
        ? guestLookup.get(activeBooking.booking.guest_id) || "Guest"
        : "Guest";

      return {
        ...room,
        bookingStart: activeBooking?.start ?? (room.checkInDate ? parseISO(room.checkInDate) : null),
        bookingEnd: activeBooking?.end ?? (room.checkOutDate ? parseISO(room.checkOutDate) : null),
        bookingGuest: activeBooking ? guestName : room.currentGuest,
      };
    });
  }, [rooms, bookings, guestLookup, dates]);

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
                        {room.bookingStart && isSameDay(date, room.bookingStart) && room.bookingGuest && (
                          <span className="truncate px-1 text-xs">
                            {room.bookingGuest}
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
