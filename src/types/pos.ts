export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'room-charge' | 'mpesa';
export type TransactionStatus = 'pending' | 'completed' | 'refunded' | 'cancelled';
export type POSCategory = 'services' | 'food-beverage' | 'amenities' | 'experiences' | 'packages' | 'beverages' | 'health';

export interface POSItem {
  id: string;
  name: string;
  category: POSCategory;
  price: number;
  cost?: number; // Cost price for profit calculation
  description: string;
  available: boolean;
  image?: string;
  stockQuantity?: number; // Link to inventory
}

export interface CartItem extends POSItem {
  quantity: number;
}

export interface Transaction {
  id: string;
  roomNumber: string;
  guestName: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  createdAt: string;
  staffName: string;
}
