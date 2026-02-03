import { useEffect, useState } from "react";
import { format, differenceInDays, addDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookingFormData, BookingStep } from "@/types/booking";
import { StepIndicator } from "./StepIndicator";
import { DateRoomStep } from "./steps/DateRoomStep";
import { GuestDetailsStep } from "./steps/GuestDetailsStep";
import { PaymentStep } from "./steps/PaymentStep";
import { BookingConfirmation } from "./steps/BookingConfirmation";
import { toast } from "sonner";
import { useCreateGuest, useCreateBooking } from "@/hooks/useGuests";
import { useUpdateRoom } from "@/hooks/useRooms";
import { usePropertySettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";

interface BookingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (booking: BookingFormData) => void;
  bookingStatus?: 'pre-arrival' | 'reserved';
}

const buildInitialDates = () => {
  const now = new Date();
  const checkIn = new Date(now);
  checkIn.setHours(14, 0, 0, 0);
  const checkOut = addDays(new Date(now), 1);
  checkOut.setHours(12, 0, 0, 0);
  return { checkIn, checkOut };
};

const { checkIn: initialCheckIn, checkOut: initialCheckOut } = buildInitialDates();

const initialFormData: BookingFormData = {
  checkIn: initialCheckIn,
  checkOut: initialCheckOut,
  checkInTime: "14:00",
  checkOutTime: "12:00",
  roomId: '',
  roomType: '',
  roomNumber: '',
  basePrice: 0,
  nights: 1,
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  guestId: undefined,
  guestCount: 1,
  idNumber: '',
  idPhotoFile: null,
  idPhotoUrl: null,
  nationality: 'Kenyan',
  bookingSource: '',
  specialRequests: '',
  totalAmount: 0,
  depositAmount: 0,
  paymentMethod: 'mpesa',
  paymentStatus: 'pending',
};

export function BookingWizard({ open, onOpenChange, onComplete, bookingStatus = 'pre-arrival' }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { data: propertySettings } = usePropertySettings();

  const createGuest = useCreateGuest();
  const createBooking = useCreateBooking();
  const updateRoom = useUpdateRoom();

  const steps: BookingStep[] = [
    { id: 1, title: "Dates & Room", description: "Select dates and room", isComplete: currentStep > 1, isCurrent: currentStep === 1 },
    { id: 2, title: "Guest Details", description: "Enter guest information", isComplete: currentStep > 2, isCurrent: currentStep === 2 },
    { id: 3, title: "Payment", description: "Process payment", isComplete: currentStep > 3, isCurrent: currentStep === 3 },
    { id: 4, title: "Confirmation", description: "Booking confirmed", isComplete: isComplete, isCurrent: currentStep === 4 },
  ];

  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      
      // Recalculate nights and total when dates change
      if (updates.checkIn || updates.checkOut) {
        const nights = differenceInDays(newData.checkOut, newData.checkIn);
        newData.nights = nights > 0 ? nights : 1;
        newData.totalAmount = newData.basePrice * newData.nights;
      }
      
      // Recalculate total when room changes
      if (updates.basePrice) {
        newData.totalAmount = updates.basePrice * newData.nights;
      }
      
      return newData;
    });
  };

  useEffect(() => {
    if (!propertySettings) return;
    const applySettings = propertySettings.apply_settings ?? true;
    if (!applySettings) return;
    setFormData((prev) => ({
      ...prev,
      checkInTime: propertySettings.check_in_time || prev.checkInTime,
      checkOutTime: propertySettings.check_out_time || prev.checkOutTime,
    }));
  }, [propertySettings]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      let idPhotoUrl: string | null = formData.idPhotoUrl || null;
      if (formData.idPhotoFile) {
        const fileExt = formData.idPhotoFile.name.split(".").pop() || "jpg";
        const filePath = `guest-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("guest-ids")
          .upload(filePath, formData.idPhotoFile, { upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("guest-ids").getPublicUrl(filePath);
        idPhotoUrl = data.publicUrl;
      }

      const guest = formData.guestId
        ? { id: formData.guestId }
        : await createGuest.mutateAsync({
            name: formData.guestName,
            email: formData.guestEmail || null,
            phone: formData.guestPhone,
            id_number: formData.idNumber || null,
            id_photo_url: idPhotoUrl,
          });

      // Create booking with correct nights calculation
      const nights = differenceInDays(formData.checkOut, formData.checkIn);
      const actualNights = nights > 0 ? nights : 1;

      const sourceNote = formData.bookingSource ? `Source: ${formData.bookingSource}` : "";
      const combinedRequests = [sourceNote, formData.specialRequests].filter(Boolean).join(" | ");

      await createBooking.mutateAsync({
        guest_id: guest.id,
        room_number: formData.roomNumber,
        room_type: formData.roomType,
        check_in: format(formData.checkIn, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        check_out: format(formData.checkOut, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        guests_count: formData.guestCount,
        total_amount: formData.basePrice * actualNights,
        paid_amount: formData.depositAmount,
        payment_method: formData.paymentMethod,
        status: bookingStatus,
        special_requests: combinedRequests || null,
      });

      // Update room status to reserved
      await updateRoom.mutateAsync({
        id: formData.roomId,
        updates: { 
          occupancy_status: 'reserved',
          current_guest_id: guest.id 
        },
      });

      setIsComplete(true);
      setCurrentStep(4);
      toast.success("Booking created successfully!");
      onComplete?.(formData);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(initialFormData);
    setIsComplete(false);
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.roomId && formData.checkIn && formData.checkOut;
      case 2:
        return formData.guestName && formData.guestPhone && formData.guestEmail && formData.idNumber;
      case 3:
        return bookingStatus === "reserved" ? formData.depositAmount >= 0 : formData.depositAmount > 0;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {bookingStatus === "reserved" ? "New Reservation" : "New Booking"}
          </DialogTitle>
        </DialogHeader>

        <StepIndicator steps={steps} />

        <div className="mt-6">
          {currentStep === 1 && (
            <DateRoomStep 
              formData={formData} 
              updateFormData={updateFormData} 
            />
          )}
          {currentStep === 2 && (
            <GuestDetailsStep 
              formData={formData} 
              updateFormData={updateFormData} 
            />
          )}
          {currentStep === 3 && (
            <PaymentStep 
              formData={formData} 
              updateFormData={updateFormData}
              onComplete={handleComplete}
            />
          )}
          {currentStep === 4 && (
            <BookingConfirmation 
              formData={formData}
              onClose={handleClose}
            />
          )}
        </div>

        {currentStep < 4 && (
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            {currentStep < 3 ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Continue
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
