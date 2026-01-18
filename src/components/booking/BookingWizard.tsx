import { useState } from "react";
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

interface BookingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (booking: BookingFormData) => void;
}

const initialFormData: BookingFormData = {
  checkIn: new Date(),
  checkOut: addDays(new Date(), 1),
  roomId: '',
  roomType: '',
  roomNumber: '',
  basePrice: 0,
  nights: 1,
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  guestCount: 1,
  idNumber: '',
  nationality: 'Kenyan',
  specialRequests: '',
  totalAmount: 0,
  depositAmount: 0,
  paymentMethod: 'mpesa',
  paymentStatus: 'pending',
};

export function BookingWizard({ open, onOpenChange, onComplete }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [isComplete, setIsComplete] = useState(false);

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

  const handleComplete = () => {
    setIsComplete(true);
    setCurrentStep(4);
    toast.success("Booking created successfully!");
    onComplete?.(formData);
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
        return formData.guestName && formData.guestPhone && formData.guestEmail;
      case 3:
        return formData.depositAmount > 0;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">New Booking</DialogTitle>
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
