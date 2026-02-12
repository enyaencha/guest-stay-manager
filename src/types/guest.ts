export type GuestStatus = 'pre-arrival' | 'checked-in' | 'checked-out' | 'no-show' | 'cancelled';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber?: string | null;
  idPhotoUrl?: string | null;
  bookingId?: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  status: GuestStatus;
  posTransactions?: Array<{
    id: string;
    date: string;
    total: number;
    subtotal?: number;
    tax?: number;
    paymentMethod: string;
    itemsSummary: string;
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
      lot_label?: string | null;
      lot_expiry?: string | null;
    }>;
    status: string;
  }>;
  lastAssessment?: {
    overallCondition: string;
    damagesFound: boolean;
    missingItemsCount: number;
    damageCost: number;
    missingCost: number;
  };
  guests?: number;
  specialRequests?: string;
  totalAmount?: number;
  paidAmount?: number;
  refundedAmount?: number;
  totalSpend?: number;
  createdAt?: string;
}

export interface GuestRequest {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  type: 'amenity' | 'service' | 'maintenance' | 'inquiry';
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  resolvedAt?: string;
}
