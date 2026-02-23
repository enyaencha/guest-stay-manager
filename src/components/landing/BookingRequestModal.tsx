import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lookupGuestByPhone } from "@/lib/guestLookup";
import { GuestPhoneLookupResult, maskEmail, maskIdNumber, normalizePhoneDigits } from "@/lib/guestPrivacy";
import { toast } from "sonner";
import { Loader2, CheckCircle, Calendar, Users, BedDouble } from "lucide-react";
import { format, differenceInCalendarDays, isValid, parseISO } from "date-fns";

interface RoomType {
  id: string;
  name: string;
  code: string;
  base_price: number;
  max_occupancy: number;
  description: string | null;
  amenities: string[] | null;
}

interface BookingRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypes: RoomType[];
  preselectedRoom?: string;
}

export const BookingRequestModal = ({ 
  open, 
  onOpenChange, 
  roomTypes,
  preselectedRoom 
}: BookingRequestModalProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [phoneLookup, setPhoneLookup] = useState<GuestPhoneLookupResult | null>(null);
  const [isLookingUpPhone, setIsLookingUpPhone] = useState(false);
  const [acceptedPhoneKey, setAcceptedPhoneKey] = useState<string | null>(null);
  const [declinedPhoneKey, setDeclinedPhoneKey] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    idNumber: "",
    checkIn: "",
    checkOut: "",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    guests: 1,
    roomType: preselectedRoom || "",
    specialRequests: "",
  });

  const selectedRoomType = roomTypes.find(rt => rt.code === formData.roomType);
  const nights = (() => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkInDate = parseISO(formData.checkIn);
    const checkOutDate = parseISO(formData.checkOut);
    if (!isValid(checkInDate) || !isValid(checkOutDate)) return 0;
    return Math.max(0, differenceInCalendarDays(checkOutDate, checkInDate));
  })();
  const totalAmount = selectedRoomType ? selectedRoomType.base_price * Math.max(nights, 0) : 0;

  const handlePhoneChange = (value: string) => {
    const phoneKey = normalizePhoneDigits(value);
    setFormData((prev) => ({ ...prev, phone: value }));

    if (acceptedPhoneKey && acceptedPhoneKey !== phoneKey) {
      setAcceptedPhoneKey(null);
    }
    if (declinedPhoneKey && declinedPhoneKey !== phoneKey) {
      setDeclinedPhoneKey(null);
    }
  };

  const handleUseMatchedDetails = () => {
    if (!phoneLookup) return;
    const phoneKey = normalizePhoneDigits(formData.phone);

    setFormData((prev) => ({
      ...prev,
      name: phoneLookup.name || "",
      email: phoneLookup.email || "",
      idNumber: phoneLookup.id_number || "",
    }));
    setAcceptedPhoneKey(phoneKey || null);
    setDeclinedPhoneKey(null);
    setPhoneLookup(null);
  };

  const handleDeclineMatchedDetails = () => {
    const phoneKey = normalizePhoneDigits(formData.phone);
    setDeclinedPhoneKey(phoneKey || null);
    setAcceptedPhoneKey(null);
    setPhoneLookup(null);
  };

  useEffect(() => {
    const phoneInput = formData.phone.trim();
    const phoneKey = normalizePhoneDigits(phoneInput);

    if (phoneKey.length < 7) {
      setPhoneLookup(null);
      setIsLookingUpPhone(false);
      return;
    }

    if (phoneKey === acceptedPhoneKey || phoneKey === declinedPhoneKey) {
      setPhoneLookup(null);
      setIsLookingUpPhone(false);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsLookingUpPhone(true);
      try {
        const match = await lookupGuestByPhone(phoneInput);
        if (isCancelled) return;
        setPhoneLookup(match);
      } catch (error) {
        if (isCancelled) return;
        console.error("Guest phone lookup failed:", error);
        setPhoneLookup(null);
      } finally {
        if (!isCancelled) {
          setIsLookingUpPhone(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [formData.phone, acceptedPhoneKey, declinedPhoneKey]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.checkIn || !formData.checkOut || !formData.roomType) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (nights <= 0) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!selectedRoomType) {
        toast.error("Selected room type not found");
        return;
      }
      // Create or find guest via RPC to avoid direct guests table access
      const { data: guestRows, error: guestError } = await supabase
        .rpc("get_or_create_guest" as any, {
          name_input: formData.name,
          phone_input: formData.phone,
          email_input: formData.email || null,
          id_number_input: formData.idNumber || null,
        });

      if (guestError || !guestRows || (guestRows as any[]).length === 0) {
        throw guestError ?? new Error("Unable to create guest record");
      }

      // Guest record created for lookup/reference

      // No room assignment at request stage

      const checkInDateTime = formData.checkIn
        ? new Date(`${formData.checkIn}T${formData.checkInTime}`)
        : null;
      const checkOutDateTime = formData.checkOut
        ? new Date(`${formData.checkOut}T${formData.checkOutTime}`)
        : null;

      // Create reservation request (not a booking)
      const { data: booking, error: bookingError } = await (supabase as any)
        .from("reservation_requests")
        .insert({
          guest_name: formData.name,
          guest_phone: formData.phone,
          guest_email: formData.email || null,
          source: "Website",
          status: "pending",
          special_requests: formData.specialRequests || null,
          request_items: [
            {
              room_type: selectedRoomType?.name || formData.roomType,
              package: selectedRoomType?.name || null,
              rooms_count: 1,
              guests_count: formData.guests,
              check_in: checkInDateTime ? checkInDateTime.toISOString() : formData.checkIn,
              check_out: checkOutDateTime ? checkOutDateTime.toISOString() : formData.checkOut,
            },
          ],
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create notification for new reservation
      await (supabase as any).from("booking_notifications").insert({
        reservation_request_id: booking.id,
        type: "new_reservation",
        title: "New Reservation Request",
        message: `${formData.name} has requested a ${selectedRoomType?.name} room from ${formData.checkIn} ${formData.checkInTime} to ${formData.checkOut} ${formData.checkOutTime} (${nights} nights). Total: Ksh ${totalAmount.toLocaleString()}`,
      });

      setBookingReference(booking.id.slice(0, 8).toUpperCase());
      setStep(3);
      toast.success("Booking request submitted successfully!");
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Failed to submit booking: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: "",
      phone: "",
      email: "",
      idNumber: "",
      checkIn: "",
      checkOut: "",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      guests: 1,
      roomType: preselectedRoom || "",
      specialRequests: "",
    });
    setBookingReference(null);
    setPhoneLookup(null);
    setAcceptedPhoneKey(null);
    setDeclinedPhoneKey(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Book Your Stay"}
            {step === 2 && "Your Details"}
            {step === 3 && "Booking Confirmed!"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in Date *</Label>
                <Input
                  type="date"
                  value={formData.checkIn}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out Date *</Label>
                <Input
                  type="date"
                  value={formData.checkOut}
                  min={formData.checkIn || format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in Time *</Label>
                <Input
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out Time *</Label>
                <Input
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Room Type *</Label>
              <Select
                value={formData.roomType}
                onValueChange={(value) => setFormData({ ...formData, roomType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((rt) => (
                    <SelectItem key={rt.id} value={rt.code}>
                      {rt.name} - Ksh {rt.base_price.toLocaleString()}/night
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Guests *</Label>
              <Input
                type="number"
                min={1}
                max={selectedRoomType?.max_occupancy || 4}
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
              />
              {selectedRoomType && (
                <p className="text-xs text-muted-foreground">
                  Max {selectedRoomType.max_occupancy} guests for {selectedRoomType.name}
                </p>
              )}
            </div>

            {nights > 0 && selectedRoomType && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{selectedRoomType.name}</span>
                  <span>Ksh {selectedRoomType.base_price.toLocaleString()}/night</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{nights} night{nights > 1 ? 's' : ''}</span>
                  <span>× {nights}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>Ksh {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={() => setStep(2)}
              disabled={!formData.checkIn || !formData.checkOut || !formData.roomType || nights <= 0}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="0712 345 678"
              />
              <p className="text-xs text-muted-foreground">
                You'll use this number to check your booking status
              </p>
              {isLookingUpPhone && (
                <p className="text-xs text-muted-foreground">Checking previous guest details...</p>
              )}
            </div>

            {phoneLookup && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">We found details from a previous reservation.</p>
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

            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>ID/Passport Number (Optional)</Label>
              <Input
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="12345678"
              />
            </div>

            <div className="space-y-2">
              <Label>Special Requests (Optional)</Label>
              <Textarea
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="Early check-in, specific floor preference, etc."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !formData.name || !formData.phone}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Booking
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Reservation Request Received!</h3>
              <p className="text-muted-foreground text-sm">
                Our team will review your request and confirm availability.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reference</span>
                <span className="font-mono font-bold text-lg">{bookingReference}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Dates
                </span>
                <span>{formData.checkIn} → {formData.checkOut}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <BedDouble className="h-4 w-4" /> Room
                </span>
                <span>{selectedRoomType?.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" /> Guests
                </span>
                <span>{formData.guests}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>Ksh {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Use your phone number <strong>{formData.phone}</strong> to check your booking status anytime.
            </p>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
