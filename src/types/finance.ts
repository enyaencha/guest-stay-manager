export type TransactionType = 'income' | 'expense';
export type IncomeCategory = 'room-booking' | 'pos-sale' | 'service-charge' | 'late-checkout' | 'damage-fee' | 'other-income';
export type ExpenseCategory = 'inventory-purchase' | 'room-amenities' | 'maintenance' | 'utilities' | 'staff-salary' | 'supplies' | 'marketing' | 'other-expense';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export interface FinanceTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: IncomeCategory | ExpenseCategory;
  description: string;
  amount: number;
  paymentStatus: PaymentStatus;
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
  transactionCount: number;
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
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  roomNumber?: string;
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
  restockedBy: string;
}
