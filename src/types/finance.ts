export type TransactionType = 'income' | 'expense';
export type IncomeCategory = 'room-booking' | 'pos-sale' | 'service-charge' | 'late-checkout' | 'damage-fee' | 'other-income' | string;
export type ExpenseCategory = 'inventory-purchase' | 'room-amenities' | 'maintenance' | 'utilities' | 'staff-salary' | 'supplies' | 'marketing' | 'other-expense' | string;
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export interface FinanceTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  reference?: string;
  roomNumber?: string;
  guestName?: string;
  vendor?: string;
  notes?: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount?: number;
  count?: number;
}

export interface MonthlyFinance {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface POSSalesRecord {
  id: string;
  date: string;
  roomNumber: string;
  items?: string;
  itemName?: string;
  category?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount: number;
  paymentMethod: string;
  staffName?: string;
  guestName?: string;
}

export interface RoomAmenityCost {
  id: string;
  date: string;
  roomNumber: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  isComplimentary?: boolean;
  restockedBy?: string;
}
