export type GuestStatus = 'pre-arrival' | 'checked-in' | 'checked-out' | 'no-show' | 'cancelled';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  status: GuestStatus;
  guests: number;
  specialRequests?: string;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
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
