import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatKsh } from "@/lib/formatters";
import { format, parseISO, isValid, differenceInCalendarDays } from "date-fns";
import { lookupGuestByPhone } from "@/lib/guestLookup";
import { GuestPhoneLookupResult, maskEmail, maskIdNumber, normalizePhoneDigits } from "@/lib/guestPrivacy";
import { 
  BedDouble, 
  Users, 
  AlertCircle,
  Check,
  Loader2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface ConfirmedBooking {
  id: string;
  booking_ids?: string[];
  guest_id: string | null;
  bill_to_guest_id?: string | null;
  guest_name: string;
  guest_phone?: string;
  room_type: string;
  room_number: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  pending_rooms?: number;
  total_amount: number;
  special_requests?: string | null;
}

interface RoomAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: ConfirmedBooking | null;
  onAssigned: () => void;
}

interface AvailableRoom {
  id: string;
  number: string;
  name: string;
  base_price: number;
  max_occupancy: number;
  room_type_id: string | null;
}

interface RoomType {
  id: string;
  name: string;
  code: string;
  base_price: number;
  max_occupancy: number;
}

export function RoomAssignmentModal({ open, onOpenChange, booking, onAssigned }: RoomAssignmentModalProps) {
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [alternativeTypes, setAlternativeTypes] = useState<RoomType[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedAlternativeType, setSelectedAlternativeType] = useState<string>("");
  const [cancelNote, setCancelNote] = useState("");
  const [arrivingGuestName, setArrivingGuestName] = useState("");
  const [arrivingGuestPhone, setArrivingGuestPhone] = useState("");
  const [arrivingGuestEmail, setArrivingGuestEmail] = useState("");
  const [arrivingGuestIdNumber, setArrivingGuestIdNumber] = useState("");
  const [arrivingGuestIdCopyFile, setArrivingGuestIdCopyFile] = useState<File | null>(null);
  const [phoneLookup, setPhoneLookup] = useState<GuestPhoneLookupResult | null>(null);
  const [isLookingUpPhone, setIsLookingUpPhone] = useState(false);
  const [acceptedPhoneKey, setAcceptedPhoneKey] = useState<string | null>(null);
  const [declinedPhoneKey, setDeclinedPhoneKey] = useState<string | null>(null);
  const [phoneLookupMessage, setPhoneLookupMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [mode, setMode] = useState<'assign' | 'change-type' | 'unavailable'>('assign');

  useEffect(() => {
    if (open && booking) {
      setArrivingGuestName("");
      setArrivingGuestPhone("");
      setArrivingGuestEmail("");
      setArrivingGuestIdNumber("");
      setArrivingGuestIdCopyFile(null);
      setPhoneLookup(null);
      setPhoneLookupMessage(null);
      setIsLookingUpPhone(false);
      setAcceptedPhoneKey(null);
      setDeclinedPhoneKey(null);
      fetchAvailableRooms();
    }
  }, [open, booking]);

  const handleArrivingGuestPhoneChange = (value: string) => {
    const nextPhoneKey = normalizePhoneDigits(value);
    setArrivingGuestPhone(value);
    setPhoneLookup(null);
    setPhoneLookupMessage(null);

    if (acceptedPhoneKey && acceptedPhoneKey !== nextPhoneKey) {
      setAcceptedPhoneKey(null);
    }
    if (declinedPhoneKey && declinedPhoneKey !== nextPhoneKey) {
      setDeclinedPhoneKey(null);
    }
  };

  const handleUseMatchedDetails = () => {
    if (!phoneLookup) return;
    const phoneKey = normalizePhoneDigits(arrivingGuestPhone);

    setArrivingGuestName(phoneLookup.name || "");
    setArrivingGuestEmail(phoneLookup.email || "");
    setArrivingGuestIdNumber(phoneLookup.id_number || "");
    setAcceptedPhoneKey(phoneKey || null);
    setDeclinedPhoneKey(null);
    setPhoneLookup(null);
    setPhoneLookupMessage(null);
  };

  const handleDeclineMatchedDetails = () => {
    const phoneKey = normalizePhoneDigits(arrivingGuestPhone);
    setDeclinedPhoneKey(phoneKey || null);
    setAcceptedPhoneKey(null);
    setPhoneLookup(null);
    setPhoneLookupMessage("Use new details for this guest.");
  };

  useEffect(() => {
    const phoneInput = arrivingGuestPhone.trim();
    const phoneKey = normalizePhoneDigits(phoneInput);

    if (phoneKey.length < 7) {
      setPhoneLookup(null);
      setIsLookingUpPhone(false);
      setPhoneLookupMessage(null);
      return;
    }

    if (phoneKey === acceptedPhoneKey || phoneKey === declinedPhoneKey) {
      setPhoneLookup(null);
      setIsLookingUpPhone(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLookingUpPhone(true);
      try {
        const match = await lookupGuestByPhone(phoneInput);
        if (cancelled) return;

        if (match) {
          setPhoneLookup(match);
          setPhoneLookupMessage(null);
        } else {
          setPhoneLookup(null);
          setPhoneLookupMessage("No previous guest found for this phone.");
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Arriving guest phone lookup failed:", error);
        setPhoneLookup(null);
        setPhoneLookupMessage(null);
      } finally {
        if (!cancelled) {
          setIsLookingUpPhone(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [arrivingGuestPhone, acceptedPhoneKey, declinedPhoneKey]);

  const fetchAvailableRooms = async () => {
    if (!booking) return;
    setLoading(true);

    try {
      // Get rooms of the requested type that are vacant
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("occupancy_status", "vacant")
        .eq("cleaning_status", "clean")
        .eq("is_active", true);

      if (error) throw error;

      // Get room types to match
      const { data: roomTypes, error: typesError } = await supabase
        .from("room_types")
        .select("*")
        .eq("is_active", true);

      if (typesError) throw typesError;

      // Find the requested room type
      const requestedType = roomTypes?.find(t => 
        t.name.toLowerCase() === booking.room_type.toLowerCase() ||
        t.code.toLowerCase() === booking.room_type.toLowerCase()
      );

      // Filter rooms by requested type
      const matchingRooms = rooms?.filter(r => 
        r.room_type_id === requestedType?.id ||
        r.name.toLowerCase().includes(booking.room_type.toLowerCase())
      ) || [];

      if (matchingRooms.length > 0) {
        setAvailableRooms(matchingRooms);
        setMode('assign');
      } else {
        // No rooms of requested type, check for alternatives
        const alternativeRooms = rooms || [];
        if (alternativeRooms.length > 0) {
          // Find unique room types that have available rooms
          const availableTypeIds = [...new Set(alternativeRooms.map(r => r.room_type_id).filter(Boolean))];
          const alternativeTypesData = roomTypes?.filter(t => 
            availableTypeIds.includes(t.id) && t.id !== requestedType?.id
          ) || [];
          
          setAlternativeTypes(alternativeTypesData);
          setMode('change-type');
        } else {
          setMode('unavailable');
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to fetch available rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRoom = async () => {
    if (!booking || !selectedRoom) return;
    setAssigning(true);

    try {
      const selectedRoomData = availableRooms.find(r => r.id === selectedRoom);
      if (!selectedRoomData) throw new Error("Room not found");

      const trimmedName = arrivingGuestName.trim();
      const trimmedPhone = arrivingGuestPhone.trim();
      const trimmedEmail = arrivingGuestEmail.trim();
      const trimmedIdNumber = arrivingGuestIdNumber.trim();
      const hasArrivingGuestInput = trimmedName || trimmedPhone || trimmedEmail;
      const hasRequiredArrivingGuest = trimmedName.length > 0 && trimmedPhone.length > 0;

      if (!trimmedIdNumber) {
        toast.error("ID/Passport number is required before check-in.");
        setAssigning(false);
        return;
      }

      if (hasArrivingGuestInput && !hasRequiredArrivingGuest) {
        toast.error("Provide both arriving guest name and phone, or leave both empty.");
        setAssigning(false);
        return;
      }

      let assignedGuestId = booking.guest_id;

      if (hasRequiredArrivingGuest) {
        const { data: idMatches, error: idLookupError } = await supabase
          .from("guests")
          .select("id")
          .eq("id_number", trimmedIdNumber)
          .limit(1);

        if (idLookupError) throw idLookupError;

        if (idMatches && idMatches.length > 0) {
          assignedGuestId = idMatches[0].id;
        } else {
          const { data: phoneMatches, error: phoneLookupError } = await supabase
            .from("guests")
            .select("id, id_number")
            .eq("phone", trimmedPhone)
            .limit(1);

          if (phoneLookupError) throw phoneLookupError;

          const phoneMatch = phoneMatches?.[0];
          if (phoneMatch && (!phoneMatch.id_number || phoneMatch.id_number === trimmedIdNumber)) {
            assignedGuestId = phoneMatch.id;
          } else {
            const { data: insertedGuest, error: insertGuestError } = await supabase
              .from("guests")
              .insert({
                name: trimmedName,
                phone: trimmedPhone,
                email: trimmedEmail || null,
                id_number: trimmedIdNumber,
              })
              .select("id")
              .single();

            if (insertGuestError) throw insertGuestError;
            assignedGuestId = insertedGuest.id;
          }
        }

        const { error: updateGuestError } = await supabase
          .from("guests")
          .update({
            name: trimmedName,
            phone: trimmedPhone,
            email: trimmedEmail || null,
            id_number: trimmedIdNumber,
          })
          .eq("id", assignedGuestId);

        if (updateGuestError) throw updateGuestError;
      }

      if (!assignedGuestId) {
        toast.error("Missing lead guest profile. Enter arriving guest name and phone.");
        setAssigning(false);
        return;
      }

      if (!hasRequiredArrivingGuest) {
        const { error: updateLeadIdError } = await supabase
          .from("guests")
          .update({ id_number: trimmedIdNumber })
          .eq("id", assignedGuestId);

        if (updateLeadIdError) throw updateLeadIdError;
      }

      if (arrivingGuestIdCopyFile) {
        const safeName = arrivingGuestIdCopyFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `guest-${assignedGuestId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("guest-docs")
          .upload(filePath, arrivingGuestIdCopyFile, { upsert: false });
        if (uploadError) throw uploadError;

        const { data: signedData, error: signedError } = await supabase.storage
          .from("guest-docs")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year for document storage reference
        if (signedError) throw signedError;
        const docUrl = signedData.signedUrl;

        const { error: updatePhotoError } = await supabase
          .from("guests")
          .update({ id_photo_url: docUrl })
          .eq("id", assignedGuestId);
        if (updatePhotoError) throw updatePhotoError;

        const fileExt = arrivingGuestIdCopyFile.name.split(".").pop() || "file";
        const { error: uploadLogError } = await supabase
          .from("guest_uploads" as any)
          .insert({
            guest_id: assignedGuestId,
            file_url: docUrl,
            file_name: arrivingGuestIdCopyFile.name,
            file_type: arrivingGuestIdCopyFile.type || fileExt,
          });
        if (uploadLogError) {
          console.warn("Failed to save guest upload log:", uploadLogError.message);
        }
      }

      const checkInDate = parseISO(booking.check_in);
      const checkOutDate = parseISO(booking.check_out);
      const nights =
        isValid(checkInDate) && isValid(checkOutDate)
          ? Math.max(1, differenceInCalendarDays(checkOutDate, checkInDate))
          : 1;
      const recalculatedTotal = Number(selectedRoomData.base_price || 0) * nights;
      const billingGuestId =
        booking.bill_to_guest_id ||
        booking.guest_id ||
        assignedGuestId;

      // Update booking with assigned room
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ 
          room_number: selectedRoomData.number,
          guest_id: assignedGuestId,
          bill_to_guest_id: billingGuestId,
          total_amount: recalculatedTotal,
          status: 'checked-in'
        })
        .eq("id", booking.id);

      if (bookingError) throw bookingError;

      // Update room status to occupied
      const { error: roomError } = await supabase
        .from("rooms")
        .update({ 
          occupancy_status: 'occupied',
          current_guest_id: assignedGuestId,
          current_booking_id: booking.id
        })
        .eq("id", selectedRoom);

      if (roomError) throw roomError;

      // Clear the old room's reserved status if different
      if (booking.room_number !== selectedRoomData.number && booking.room_number !== 'TBA') {
        await supabase
          .from("rooms")
          .update({ occupancy_status: 'vacant' })
          .eq("number", booking.room_number);
      }

      toast.success(`Guest checked in to Room ${selectedRoomData.number}. Bill set to ${formatKsh(recalculatedTotal)}.`);
      onAssigned();
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning room:", error);
      toast.error("Failed to assign room");
    } finally {
      setAssigning(false);
    }
  };

  const handleChangeType = async () => {
    if (!booking || !selectedAlternativeType) return;
    setAssigning(true);

    try {
      const newType = alternativeTypes.find(t => t.id === selectedAlternativeType);
      if (!newType) throw new Error("Room type not found");

      // Update booking with new room type
      const { error } = await supabase
        .from("bookings")
        .update({ room_type: newType.name })
        .eq("id", booking.id);

      if (error) throw error;

      toast.success(`Room type changed to ${newType.name}. Please assign a room.`);
      
      // Refetch to get rooms of new type
      setSelectedAlternativeType("");
      fetchAvailableRooms();
    } catch (error) {
      console.error("Error changing room type:", error);
      toast.error("Failed to change room type");
    } finally {
      setAssigning(false);
    }
  };

  const handleCancel = async () => {
    if (!booking || !cancelNote.trim()) {
      toast.error("Please provide a reason for the cancellation");
      return;
    }
    setAssigning(true);

    try {
      // Update booking status
      const { error } = await supabase
        .from("bookings")
        .update({ 
          status: 'cancelled',
          special_requests: `${booking.special_requests || ''}\n\n[Cancellation Note]: ${cancelNote}`
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Create notification
      await supabase.from("booking_notifications").insert({
        booking_id: booking.id,
        type: 'reservation_cancelled',
        title: 'Reservation Unavailable',
        message: `We regret to inform you that your reservation could not be accommodated. ${cancelNote}`,
      });

      toast.success("Guest notified about unavailability");
      onAssigned();
      onOpenChange(false);
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Failed to process cancellation");
    } finally {
      setAssigning(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'assign' && 'Assign Room'}
            {mode === 'change-type' && 'Room Type Unavailable'}
            {mode === 'unavailable' && 'No Rooms Available'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'assign' &&
              `Select a room for ${booking.guest_name}${
                booking.pending_rooms && booking.pending_rooms > 1
                  ? ` (${booking.pending_rooms} room requests pending)`
                  : ""
              }`}
            {mode === 'change-type' && `No ${booking.room_type} rooms available. Choose an alternative.`}
            {mode === 'unavailable' && 'Unfortunately, no rooms are available at this time.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Booking Summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{booking.guest_name}</span>
                <Badge variant="outline">{booking.guests_count} Guest{booking.guests_count > 1 ? 's' : ''}</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Requested: <span className="capitalize font-medium">{booking.room_type}</span></p>
                {booking.pending_rooms && booking.pending_rooms > 1 && (
                  <p>Pending rooms: <span className="font-medium">{booking.pending_rooms}</span></p>
                )}
                <p>
                  {(() => {
                    const checkIn = parseISO(booking.check_in);
                    const checkOut = parseISO(booking.check_out);
                    const checkInLabel = isValid(checkIn) ? format(checkIn, "MMM d, yyyy • HH:mm") : booking.check_in;
                    const checkOutLabel = isValid(checkOut) ? format(checkOut, "MMM d, yyyy • HH:mm") : booking.check_out;
                    return `${checkInLabel} - ${checkOutLabel}`;
                  })()}
                </p>
              </div>
            </div>

            {mode === 'assign' && (
              <>
                <div className="space-y-3 p-3 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Guest For This Room</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can use lead guest ({booking.guest_name}) or enter arriving guest details. ID is mandatory.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Arriving guest phone"
                      value={arrivingGuestPhone}
                      onChange={(e) => handleArrivingGuestPhoneChange(e.target.value)}
                    />
                    <Input
                      placeholder="Arriving guest name"
                      value={arrivingGuestName}
                      onChange={(e) => setArrivingGuestName(e.target.value)}
                    />
                  </div>
                  {isLookingUpPhone && (
                    <p className="text-xs text-muted-foreground">Checking previous guest details...</p>
                  )}
                  {phoneLookup && (
                    <div className="rounded-md border bg-muted/40 p-3 space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">We found previous guest details for this phone number.</p>
                        <p className="text-xs text-muted-foreground">
                          Confirm first to prefill. Sensitive fields are masked until you approve.
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Name: {phoneLookup.name}</p>
                        <p>Email: {maskEmail(phoneLookup.email)}</p>
                        <p>ID/Passport: {maskIdNumber(phoneLookup.id_number)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={handleUseMatchedDetails}>
                          Use My Details
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={handleDeclineMatchedDetails}>
                          Not Me
                        </Button>
                      </div>
                    </div>
                  )}
                  {!isLookingUpPhone && phoneLookupMessage && (
                    <p className="text-xs text-muted-foreground">{phoneLookupMessage}</p>
                  )}
                  <Input
                    placeholder="Arriving guest email (optional)"
                    value={arrivingGuestEmail}
                    onChange={(e) => setArrivingGuestEmail(e.target.value)}
                  />
                  <Input
                    placeholder="ID/Passport number *"
                    value={arrivingGuestIdNumber}
                    onChange={(e) => setArrivingGuestIdNumber(e.target.value)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={`id-copy-${booking.id}`} className="text-xs text-muted-foreground">
                      ID copy upload (optional)
                    </Label>
                    <Input
                      id={`id-copy-${booking.id}`}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setArrivingGuestIdCopyFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <RadioGroup value={selectedRoom} onValueChange={setSelectedRoom}>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {availableRooms.map((room) => (
                      <div key={room.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={room.id} id={room.id} />
                        <Label htmlFor={room.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BedDouble className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Room {room.number}</span>
                              <span className="text-sm text-muted-foreground">({room.name})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{room.max_occupancy}</span>
                              <span className="font-medium">{formatKsh(room.base_price)}/night</span>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAssignRoom} disabled={!selectedRoom || assigning} className="flex-1">
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Check In Guest
                  </Button>
                </div>
              </>
            )}

            {mode === 'change-type' && (
              <>
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">The requested {booking.room_type} rooms are fully booked.</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Available alternatives:</p>
                  <RadioGroup value={selectedAlternativeType} onValueChange={setSelectedAlternativeType}>
                    <div className="space-y-2">
                      {alternativeTypes.map((type) => (
                        <div key={type.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value={type.id} id={type.id} />
                          <Label htmlFor={type.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{type.name}</span>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Max {type.max_occupancy}</span>
                                <span className="font-medium">{formatKsh(type.base_price)}/night</span>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCancelNote("");
                      setMode('unavailable');
                    }}
                    className="flex-1"
                  >
                    Notify Guest
                  </Button>
                  <Button 
                    onClick={handleChangeType} 
                    disabled={!selectedAlternativeType || assigning} 
                    className="flex-1"
                  >
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Change Type
                  </Button>
                </div>
              </>
            )}

            {mode === 'unavailable' && (
              <>
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">No rooms are currently available for this booking.</span>
                </div>

                <div className="space-y-2">
                  <Label>Message to Guest (required)</Label>
                  <Textarea
                    placeholder="We sincerely apologize for the inconvenience. Unfortunately, we are unable to accommodate your reservation at this time due to..."
                    value={cancelNote}
                    onChange={(e) => setCancelNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    The guest will receive a polite notification about the unavailability.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setMode('change-type');
                      setCancelNote("");
                    }}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleCancel} 
                    disabled={!cancelNote.trim() || assigning} 
                    className="flex-1"
                  >
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Notify & Close
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
