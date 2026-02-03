import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BookingFormData } from "@/types/booking";
import { formatKsh } from "@/lib/formatters";
import { 
  CheckCircle2, 
  Mail, 
  Printer, 
  Calendar,
  BedDouble,
  User,
  Phone
} from "lucide-react";

interface BookingConfirmationProps {
  formData: BookingFormData;
  onClose: () => void;
}

export function BookingConfirmation({ formData, onClose }: BookingConfirmationProps) {
  const bookingRef = `BK${Date.now().toString().slice(-8)}`;

  return (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-status-available/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-status-available" />
        </div>
        <h2 className="text-xl font-bold">Booking Confirmed!</h2>
        <p className="text-muted-foreground">Reference: {bookingRef}</p>
      </div>

      {/* Booking Details Card */}
      <div className="p-5 rounded-xl border bg-card">
        <div className="space-y-4">
          {/* Room Info */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <BedDouble className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Room {formData.roomNumber}</p>
              <p className="text-sm text-muted-foreground capitalize">{formData.roomType}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {format(formData.checkIn, 'EEE, dd MMM')} → {format(formData.checkOut, 'EEE, dd MMM yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(formData.checkIn, "p")} check-in · {format(formData.checkOut, "p")} check-out
              </p>
              <p className="text-sm text-muted-foreground">{formData.nights} night{formData.nights > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Guest Info */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{formData.guestName}</p>
              <p className="text-sm text-muted-foreground">{formData.guestCount} guest{formData.guestCount > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Phone className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{formData.guestPhone}</p>
              <p className="text-sm text-muted-foreground">{formData.guestEmail}</p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Amount</span>
            <span>{formatKsh(formData.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deposit Paid</span>
            <span className="text-status-available font-medium">{formatKsh(formData.depositAmount)}</span>
          </div>
          {formData.depositAmount < formData.totalAmount && (
            <div className="flex justify-between text-sm font-medium">
              <span>Balance Due</span>
              <span>{formatKsh(formData.totalAmount - formData.depositAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1 gap-2">
          <Mail className="h-4 w-4" />
          Send Confirmation Email
        </Button>
        <Button variant="outline" className="flex-1 gap-2">
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
      </div>

      <Button className="w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
