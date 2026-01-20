import { 
  FinanceTransaction, 
  FinanceSummary, 
  CategoryBreakdown, 
  MonthlyFinance,
  POSSalesRecord,
  RoomAmenityCost 
} from "@/types/finance";
import { roomRevenueJan2026 } from "./mockRooms";
import { stockSummaryJan2026 } from "./mockInventory";
import { mockExpenseRecords, calculateExpenseSummary } from "./mockExpenses";

// Finance transactions based on real data from Excel files
export const mockFinanceTransactions: FinanceTransaction[] = [
  // Room Income - January 2026 from ROOMS ANALYSIS
  // Basic Rooms Revenue: KSH 8,000 (8 nights @ 1,000)
  {
    id: "FIN001",
    date: "2026-01-01",
    type: "income",
    category: "room-booking",
    description: "Basic Rooms (2A, 2B, 3B, 4A, 4B, 6B) - 7 rooms",
    amount: 7000,
    paymentStatus: "paid",
    reference: "RM-2026-01-01",
    roomNumber: "Multiple",
  },
  {
    id: "FIN002",
    date: "2026-01-02",
    type: "income",
    category: "room-booking",
    description: "Basic Room 4A - 1 night",
    amount: 1000,
    paymentStatus: "paid",
    reference: "RM-2026-01-02",
    roomNumber: "4A",
  },
  // Standard Rooms Revenue: KSH 22,000 (11 nights @ 2,000)
  {
    id: "FIN003",
    date: "2026-01-01",
    type: "income",
    category: "room-booking",
    description: "Standard Rooms (G6, G7, G9) - 4 rooms",
    amount: 8000,
    paymentStatus: "paid",
    reference: "RM-2026-01-03",
    roomNumber: "Multiple",
  },
  {
    id: "FIN004",
    date: "2026-01-02",
    type: "income",
    category: "room-booking",
    description: "Standard Rooms (G5, G6, G9) - 3 rooms",
    amount: 6000,
    paymentStatus: "paid",
    reference: "RM-2026-01-04",
    roomNumber: "Multiple",
  },
  {
    id: "FIN005",
    date: "2026-01-11",
    type: "income",
    category: "room-booking",
    description: "Standard Room G1 - Extended stay begins",
    amount: 2000,
    paymentStatus: "paid",
    reference: "RM-2026-01-11",
    roomNumber: "G1",
  },
  {
    id: "FIN006",
    date: "2026-01-13",
    type: "income",
    category: "room-booking",
    description: "Standard Room G1 - 1 night",
    amount: 2000,
    paymentStatus: "paid",
    reference: "RM-2026-01-13",
    roomNumber: "G1",
  },
  {
    id: "FIN007",
    date: "2026-01-14",
    type: "income",
    category: "room-booking",
    description: "Standard Room G1 - 1 night",
    amount: 2000,
    paymentStatus: "paid",
    reference: "RM-2026-01-14",
    roomNumber: "G1",
  },
  {
    id: "FIN008",
    date: "2026-01-15",
    type: "income",
    category: "room-booking",
    description: "Standard Room G1 - 1 night",
    amount: 2000,
    paymentStatus: "paid",
    reference: "RM-2026-01-15",
    roomNumber: "G1",
  },
  // Superior Rooms Revenue (4 nights @ 2,300 = 9,200 but showing 0 in Excel totals)
  {
    id: "FIN009",
    date: "2026-01-01",
    type: "income",
    category: "room-booking",
    description: "Superior Rooms (F2, F5, F6) - 3 rooms",
    amount: 6900,
    paymentStatus: "pending", // Marked pending as Excel shows 0 in totals
    reference: "RM-2026-01-09",
    roomNumber: "Multiple",
  },
  {
    id: "FIN010",
    date: "2026-01-06",
    type: "income",
    category: "room-booking",
    description: "Superior Room F1 - 1 night",
    amount: 2300,
    paymentStatus: "pending",
    reference: "RM-2026-01-10",
    roomNumber: "F1",
  },
  // POS Sales from stock - KSH 14,430
  {
    id: "FIN011",
    date: "2026-01-01",
    type: "income",
    category: "pos-sale",
    description: "Water 500ML Sales - 40 units @ KSH 50",
    amount: 2000,
    paymentStatus: "paid",
    reference: "POS-2026-01-01",
  },
  {
    id: "FIN012",
    date: "2026-01-01",
    type: "income",
    category: "pos-sale",
    description: "Water 1LT Sales - 18 units @ KSH 100",
    amount: 1800,
    paymentStatus: "paid",
    reference: "POS-2026-01-02",
  },
  {
    id: "FIN013",
    date: "2026-01-01",
    type: "income",
    category: "pos-sale",
    description: "Trust Condoms - 14 units @ KSH 100",
    amount: 1400,
    paymentStatus: "paid",
    reference: "POS-2026-01-03",
  },
  {
    id: "FIN014",
    date: "2026-01-01",
    type: "income",
    category: "pos-sale",
    description: "Soda 500ML - 10 units @ KSH 100",
    amount: 1000,
    paymentStatus: "paid",
    reference: "POS-2026-01-04",
  },
  {
    id: "FIN015",
    date: "2026-01-01",
    type: "income",
    category: "pos-sale",
    description: "Miscellaneous POS items",
    amount: 2630,
    paymentStatus: "paid",
    reference: "POS-2026-01-05",
  },
  {
    id: "FIN016",
    date: "2026-01-14",
    type: "income",
    category: "pos-sale",
    description: "Water 500ML & 1LT Sales",
    amount: 2400,
    paymentStatus: "paid",
    reference: "POS-2026-01-14",
  },
  {
    id: "FIN017",
    date: "2026-01-14",
    type: "income",
    category: "pos-sale",
    description: "Trust, Vaseline, Toothpaste sales",
    amount: 3200,
    paymentStatus: "paid",
    reference: "POS-2026-01-14B",
  },
  // Expenses - from purchases and operating costs
  {
    id: "FIN018",
    date: "2026-01-16",
    type: "expense",
    category: "inventory-purchase",
    description: "Sawa Soap restock - 432 pieces",
    amount: 2655,
    paymentStatus: "paid",
    reference: "PO-2026-001",
    vendor: "Wholesale Supplier"
  },
  {
    id: "FIN019",
    date: "2026-01-02",
    type: "expense",
    category: "inventory-purchase",
    description: "Water 500ML - 48 bottles",
    amount: 800,
    paymentStatus: "paid",
    reference: "PO-2026-002",
    vendor: "Beverage Supplier"
  },
  {
    id: "FIN020",
    date: "2026-01-16",
    type: "expense",
    category: "inventory-purchase",
    description: "Trust Condoms - 48 packs",
    amount: 1180,
    paymentStatus: "paid",
    reference: "PO-2026-003",
    vendor: "Pharmacy Supplier"
  },
  {
    id: "FIN021",
    date: "2026-01-16",
    type: "expense",
    category: "inventory-purchase",
    description: "Vaseline - 24 pieces",
    amount: 920,
    paymentStatus: "paid",
    reference: "PO-2026-004",
    vendor: "Pharmacy Supplier"
  },
  {
    id: "FIN022",
    date: "2026-01-10",
    type: "expense",
    category: "utilities",
    description: "Electricity bill - January",
    amount: 15000,
    paymentStatus: "paid",
    reference: "UTIL-2026-001",
    vendor: "Kenya Power"
  },
  {
    id: "FIN023",
    date: "2026-01-10",
    type: "expense",
    category: "utilities",
    description: "Water bill - January",
    amount: 8500,
    paymentStatus: "paid",
    reference: "UTIL-2026-002",
    vendor: "Nairobi Water"
  },
  {
    id: "FIN024",
    date: "2026-01-20",
    type: "expense",
    category: "staff-salary",
    description: "Staff salaries - January",
    amount: 85000,
    paymentStatus: "pending",
    reference: "SAL-2026-001",
  },
];

// POS Sales history from actual stock movements
export const mockPOSSalesHistory: POSSalesRecord[] = [
  {
    id: "POSH001",
    date: "2026-01-01",
    itemName: "Water 500ML",
    category: "Beverages",
    quantity: 40,
    unitPrice: 50,
    totalAmount: 2000,
    paymentMethod: "Cash",
  },
  {
    id: "POSH002",
    date: "2026-01-01",
    itemName: "Water 1LT",
    category: "Beverages",
    quantity: 18,
    unitPrice: 100,
    totalAmount: 1800,
    paymentMethod: "M-Pesa",
  },
  {
    id: "POSH003",
    date: "2026-01-01",
    itemName: "Trust Condoms",
    category: "Amenities",
    quantity: 14,
    unitPrice: 100,
    totalAmount: 1400,
    paymentMethod: "Cash",
  },
  {
    id: "POSH004",
    date: "2026-01-01",
    itemName: "Soda 500ML",
    category: "Beverages",
    quantity: 10,
    unitPrice: 100,
    totalAmount: 1000,
    paymentMethod: "Cash",
  },
  {
    id: "POSH005",
    date: "2026-01-01",
    itemName: "Predator Energy",
    category: "Beverages",
    quantity: 11,
    unitPrice: 100,
    totalAmount: 1100,
    paymentMethod: "M-Pesa",
  },
  {
    id: "POSH006",
    date: "2026-01-01",
    itemName: "Toothpaste & Brush",
    category: "Amenities",
    quantity: 12,
    unitPrice: 50,
    totalAmount: 600,
    paymentMethod: "Room Charge",
    roomNumber: "Multiple"
  },
  {
    id: "POSH007",
    date: "2026-01-01",
    itemName: "Panadol Extra",
    category: "Health",
    quantity: 10,
    unitPrice: 30,
    totalAmount: 300,
    paymentMethod: "Cash",
  },
  {
    id: "POSH008",
    date: "2026-01-14",
    itemName: "Water 500ML",
    category: "Beverages",
    quantity: 24,
    unitPrice: 50,
    totalAmount: 1200,
    paymentMethod: "M-Pesa",
  },
  {
    id: "POSH009",
    date: "2026-01-14",
    itemName: "Water 1LT",
    category: "Beverages",
    quantity: 12,
    unitPrice: 100,
    totalAmount: 1200,
    paymentMethod: "Cash",
  },
  {
    id: "POSH010",
    date: "2026-01-14",
    itemName: "Trust Condoms",
    category: "Amenities",
    quantity: 14,
    unitPrice: 100,
    totalAmount: 1400,
    paymentMethod: "M-Pesa",
  },
  {
    id: "POSH011",
    date: "2026-01-14",
    itemName: "Vaseline",
    category: "Amenities",
    quantity: 16,
    unitPrice: 50,
    totalAmount: 800,
    paymentMethod: "Cash",
  },
  {
    id: "POSH012",
    date: "2026-01-14",
    itemName: "Toothpaste & Brush",
    category: "Amenities",
    quantity: 11,
    unitPrice: 50,
    totalAmount: 550,
    paymentMethod: "Room Charge",
    roomNumber: "G1"
  },
];

// Room amenity costs - items used in rooms (not sold)
export const mockRoomAmenityCosts: RoomAmenityCost[] = [
  {
    id: "RAC001",
    date: "2026-01-01",
    roomNumber: "2A",
    itemName: "Tissues",
    quantity: 10,
    unitCost: 20,
    totalCost: 200,
    restockedBy: "Housekeeping"
  },
  {
    id: "RAC002",
    date: "2026-01-01",
    roomNumber: "2B",
    itemName: "Tissues",
    quantity: 10,
    unitCost: 20,
    totalCost: 200,
    restockedBy: "Housekeeping"
  },
  {
    id: "RAC003",
    date: "2026-01-01",
    roomNumber: "G6",
    itemName: "Sawa Soap",
    quantity: 20,
    unitCost: 6.15,
    totalCost: 123,
    restockedBy: "Housekeeping"
  },
  {
    id: "RAC004",
    date: "2026-01-01",
    roomNumber: "G7",
    itemName: "Tissues",
    quantity: 15,
    unitCost: 20,
    totalCost: 300,
    restockedBy: "Housekeeping"
  },
  {
    id: "RAC005",
    date: "2026-01-01",
    roomNumber: "F2",
    itemName: "Sawa Soap",
    quantity: 25,
    unitCost: 6.15,
    totalCost: 153.75,
    restockedBy: "Housekeeping"
  },
  {
    id: "RAC006",
    date: "2026-01-14",
    roomNumber: "G1",
    itemName: "Tissues",
    quantity: 20,
    unitCost: 20,
    totalCost: 400,
    restockedBy: "Housekeeping"
  },
  {
    id: "RAC007",
    date: "2026-01-14",
    roomNumber: "G1",
    itemName: "Sawa Soap",
    quantity: 30,
    unitCost: 6.15,
    totalCost: 184.50,
    restockedBy: "Housekeeping"
  },
];

// Monthly finance based on actual data
export const mockMonthlyFinance: MonthlyFinance[] = [
  { 
    month: "Jan 2026", 
    income: roomRevenueJan2026.total.revenue + stockSummaryJan2026.stockOutSalesValue, // 30,000 + 14,430
    expenses: stockSummaryJan2026.purchasesValue + 23500 + 85000, // Purchases + Utilities + Salaries
    profit: (roomRevenueJan2026.total.revenue + stockSummaryJan2026.stockOutSalesValue) - (stockSummaryJan2026.purchasesValue + 23500 + 85000)
  },
];

export const calculateFinanceSummary = (transactions: FinanceTransaction[]): FinanceSummary => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const pendingPayments = transactions
    .filter(t => t.paymentStatus === 'pending' || t.paymentStatus === 'overdue')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    pendingPayments
  };
};

export const calculateCategoryBreakdown = (
  transactions: FinanceTransaction[], 
  type: 'income' | 'expense'
): CategoryBreakdown[] => {
  const filtered = transactions.filter(t => t.type === type);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  
  const categoryMap = new Map<string, { amount: number; count: number }>();
  
  filtered.forEach(t => {
    const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
    categoryMap.set(t.category, {
      amount: existing.amount + t.amount,
      count: existing.count + 1
    });
  });

  const categoryLabels: Record<string, string> = {
    'room-booking': 'Room Bookings',
    'pos-sale': 'POS Sales',
    'service-charge': 'Service Charges',
    'late-checkout': 'Late Checkout',
    'damage-fee': 'Damage Fees',
    'other-income': 'Other Income',
    'inventory-purchase': 'Inventory Purchases',
    'room-amenities': 'Room Amenities',
    'maintenance': 'Maintenance',
    'utilities': 'Utilities',
    'staff-salary': 'Staff Salaries',
    'supplies': 'Supplies',
    'marketing': 'Marketing',
    'other-expense': 'Other Expenses'
  };

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category: categoryLabels[category] || category,
    amount: data.amount,
    percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
    transactionCount: data.count
  })).sort((a, b) => b.amount - a.amount);
};

// Get January 2026 summary
export const getJan2026Summary = () => {
  return {
    roomRevenue: roomRevenueJan2026.total.revenue, // KSH 30,000
    posRevenue: stockSummaryJan2026.stockOutSalesValue, // KSH 14,430
    totalIncome: roomRevenueJan2026.total.revenue + stockSummaryJan2026.stockOutSalesValue,
    purchasesCost: stockSummaryJan2026.purchasesValue, // KSH 5,555
    grossProfit: stockSummaryJan2026.stockOutSalesValue - stockSummaryJan2026.purchasesValue,
    roomNights: roomRevenueJan2026.total.nights, // 23 nights
  };
};
