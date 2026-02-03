export interface BookingFormData {
  // Step 1: Dates & Room
  checkIn: Date;
  checkOut: Date;
  checkInTime: string;
  checkOutTime: string;
  roomId: string;
  roomType: string;
  roomNumber: string;
  basePrice: number;
  nights: number;
  
  // Step 2: Guest Details
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestId?: string;
  guestCount: number;
  idNumber: string;
  idPhotoFile?: File | null;
  idPhotoUrl?: string | null;
  nationality: string;
  bookingSource: string;
  specialRequests: string;
  
  // Step 3: Payment
  totalAmount: number;
  depositAmount: number;
  paymentMethod: 'withdraw' | 'mpesa' | 'card' | 'bank-transfer';
  paymentStatus: 'pending' | 'partial' | 'paid';
}

export interface BookingStep {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
  isCurrent: boolean;
}
