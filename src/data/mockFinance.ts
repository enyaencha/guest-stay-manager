import { 
  FinanceTransaction, 
  FinanceSummary, 
  CategoryBreakdown, 
  MonthlyFinance,
  POSSalesRecord,
  RoomAmenityCost 
} from "@/types/finance";

export const mockFinanceTransactions: FinanceTransaction[] = [
  // Income transactions
  {
    id: "FIN001",
    date: "2024-01-16",
    type: "income",
    category: "room-booking",
    description: "Room 101 - Standard Room (3 nights)",
    amount: 45000,
    paymentStatus: "paid",
    reference: "BK-2024-001",
    roomNumber: "101",
    guestName: "John Kamau"
  },
  {
    id: "FIN002",
    date: "2024-01-16",
    type: "income",
    category: "pos-sale",
    description: "Breakfast Buffet x 2",
    amount: 3200,
    paymentStatus: "paid",
    reference: "POS-2024-045",
    roomNumber: "203",
    guestName: "Sarah Wanjiku"
  },
  {
    id: "FIN003",
    date: "2024-01-15",
    type: "income",
    category: "room-booking",
    description: "Room 305 - Deluxe Suite (5 nights)",
    amount: 125000,
    paymentStatus: "paid",
    reference: "BK-2024-002",
    roomNumber: "305",
    guestName: "Peter Ochieng"
  },
  {
    id: "FIN004",
    date: "2024-01-15",
    type: "income",
    category: "late-checkout",
    description: "Late checkout - Room 102",
    amount: 2500,
    paymentStatus: "paid",
    reference: "SVC-2024-012",
    roomNumber: "102",
    guestName: "Mary Njeri"
  },
  {
    id: "FIN005",
    date: "2024-01-15",
    type: "income",
    category: "pos-sale",
    description: "Airport Transfer",
    amount: 4500,
    paymentStatus: "paid",
    reference: "POS-2024-044",
    roomNumber: "101",
    guestName: "John Kamau"
  },
  {
    id: "FIN006",
    date: "2024-01-14",
    type: "income",
    category: "room-booking",
    description: "Room 202 - Family Suite (2 nights)",
    amount: 56000,
    paymentStatus: "pending",
    reference: "BK-2024-003",
    roomNumber: "202",
    guestName: "David Mwangi"
  },
  {
    id: "FIN007",
    date: "2024-01-14",
    type: "income",
    category: "pos-sale",
    description: "Spa Treatment - Full Body Massage",
    amount: 8500,
    paymentStatus: "paid",
    reference: "POS-2024-043",
    roomNumber: "305",
    guestName: "Peter Ochieng"
  },
  {
    id: "FIN008",
    date: "2024-01-13",
    type: "income",
    category: "service-charge",
    description: "Room Service Charge",
    amount: 1200,
    paymentStatus: "paid",
    reference: "SVC-2024-011",
    roomNumber: "203"
  },
  // Expense transactions
  {
    id: "FIN009",
    date: "2024-01-16",
    type: "expense",
    category: "inventory-purchase",
    description: "Towels and Linens Restock",
    amount: 35000,
    paymentStatus: "paid",
    reference: "PO-2024-018",
    vendor: "Kenya Textiles Ltd"
  },
  {
    id: "FIN010",
    date: "2024-01-15",
    type: "expense",
    category: "room-amenities",
    description: "Toiletries and Bathroom Supplies",
    amount: 18500,
    paymentStatus: "paid",
    reference: "PO-2024-017",
    vendor: "Unilever Kenya"
  },
  {
    id: "FIN011",
    date: "2024-01-15",
    type: "expense",
    category: "maintenance",
    description: "AC Unit Repair - Room 104",
    amount: 12000,
    paymentStatus: "paid",
    reference: "MNT-2024-008",
    roomNumber: "104",
    vendor: "Cool Air Services"
  },
  {
    id: "FIN012",
    date: "2024-01-14",
    type: "expense",
    category: "utilities",
    description: "Electricity Bill - January",
    amount: 85000,
    paymentStatus: "pending",
    reference: "UTIL-2024-001",
    vendor: "Kenya Power"
  },
  {
    id: "FIN013",
    date: "2024-01-14",
    type: "expense",
    category: "supplies",
    description: "Cleaning Supplies Restock",
    amount: 22000,
    paymentStatus: "paid",
    reference: "PO-2024-016",
    vendor: "CleanPro Supplies"
  },
  {
    id: "FIN014",
    date: "2024-01-13",
    type: "expense",
    category: "staff-salary",
    description: "Housekeeping Staff Overtime",
    amount: 15000,
    paymentStatus: "paid",
    reference: "SAL-2024-005"
  },
  {
    id: "FIN015",
    date: "2024-01-12",
    type: "expense",
    category: "room-amenities",
    description: "Mini Bar Restocking - All Rooms",
    amount: 28000,
    paymentStatus: "paid",
    reference: "PO-2024-015",
    vendor: "EABL Distributors"
  },
  {
    id: "FIN016",
    date: "2024-01-11",
    type: "expense",
    category: "marketing",
    description: "Online Booking Platform Commission",
    amount: 45000,
    paymentStatus: "overdue",
    reference: "MKT-2024-002",
    vendor: "Booking.com"
  }
];

export const mockPOSSalesHistory: POSSalesRecord[] = [
  {
    id: "POSH001",
    date: "2024-01-16",
    itemName: "Breakfast Buffet",
    category: "Food & Beverage",
    quantity: 2,
    unitPrice: 1600,
    totalAmount: 3200,
    paymentMethod: "Room Charge",
    roomNumber: "203",
    guestName: "Sarah Wanjiku"
  },
  {
    id: "POSH002",
    date: "2024-01-16",
    itemName: "Late Checkout",
    category: "Services",
    quantity: 1,
    unitPrice: 2500,
    totalAmount: 2500,
    paymentMethod: "M-Pesa",
    roomNumber: "102",
    guestName: "Mary Njeri"
  },
  {
    id: "POSH003",
    date: "2024-01-15",
    itemName: "Airport Transfer",
    category: "Services",
    quantity: 1,
    unitPrice: 4500,
    totalAmount: 4500,
    paymentMethod: "Cash",
    roomNumber: "101",
    guestName: "John Kamau"
  },
  {
    id: "POSH004",
    date: "2024-01-15",
    itemName: "Spa Treatment",
    category: "Experiences",
    quantity: 1,
    unitPrice: 8500,
    totalAmount: 8500,
    paymentMethod: "Card",
    roomNumber: "305",
    guestName: "Peter Ochieng"
  },
  {
    id: "POSH005",
    date: "2024-01-14",
    itemName: "Room Service Dinner",
    category: "Food & Beverage",
    quantity: 2,
    unitPrice: 3500,
    totalAmount: 7000,
    paymentMethod: "Room Charge",
    roomNumber: "202",
    guestName: "David Mwangi"
  },
  {
    id: "POSH006",
    date: "2024-01-14",
    itemName: "Mini Bar Items",
    category: "Amenities",
    quantity: 5,
    unitPrice: 350,
    totalAmount: 1750,
    paymentMethod: "Room Charge",
    roomNumber: "305",
    guestName: "Peter Ochieng"
  },
  {
    id: "POSH007",
    date: "2024-01-13",
    itemName: "Laundry Service",
    category: "Services",
    quantity: 1,
    unitPrice: 1500,
    totalAmount: 1500,
    paymentMethod: "M-Pesa",
    roomNumber: "101"
  },
  {
    id: "POSH008",
    date: "2024-01-13",
    itemName: "Breakfast Buffet",
    category: "Food & Beverage",
    quantity: 4,
    unitPrice: 1600,
    totalAmount: 6400,
    paymentMethod: "Cash"
  }
];

export const mockRoomAmenityCosts: RoomAmenityCost[] = [
  {
    id: "RAC001",
    date: "2024-01-16",
    roomNumber: "101",
    itemName: "Bath Towels",
    quantity: 4,
    unitCost: 500,
    totalCost: 2000,
    restockedBy: "Grace Akinyi"
  },
  {
    id: "RAC002",
    date: "2024-01-16",
    roomNumber: "101",
    itemName: "Shampoo",
    quantity: 2,
    unitCost: 150,
    totalCost: 300,
    restockedBy: "Grace Akinyi"
  },
  {
    id: "RAC003",
    date: "2024-01-16",
    roomNumber: "203",
    itemName: "Toilet Paper",
    quantity: 4,
    unitCost: 80,
    totalCost: 320,
    restockedBy: "James Otieno"
  },
  {
    id: "RAC004",
    date: "2024-01-15",
    roomNumber: "305",
    itemName: "Mini Bar - Sodas",
    quantity: 6,
    unitCost: 100,
    totalCost: 600,
    restockedBy: "Grace Akinyi"
  },
  {
    id: "RAC005",
    date: "2024-01-15",
    roomNumber: "305",
    itemName: "Mini Bar - Water",
    quantity: 4,
    unitCost: 50,
    totalCost: 200,
    restockedBy: "Grace Akinyi"
  },
  {
    id: "RAC006",
    date: "2024-01-15",
    roomNumber: "102",
    itemName: "Body Lotion",
    quantity: 2,
    unitCost: 200,
    totalCost: 400,
    restockedBy: "James Otieno"
  },
  {
    id: "RAC007",
    date: "2024-01-14",
    roomNumber: "202",
    itemName: "Bath Towels",
    quantity: 6,
    unitCost: 500,
    totalCost: 3000,
    restockedBy: "Grace Akinyi"
  },
  {
    id: "RAC008",
    date: "2024-01-14",
    roomNumber: "104",
    itemName: "Conditioner",
    quantity: 2,
    unitCost: 180,
    totalCost: 360,
    restockedBy: "James Otieno"
  },
  {
    id: "RAC009",
    date: "2024-01-13",
    roomNumber: "101",
    itemName: "Soap Bars",
    quantity: 4,
    unitCost: 100,
    totalCost: 400,
    restockedBy: "Grace Akinyi"
  },
  {
    id: "RAC010",
    date: "2024-01-13",
    roomNumber: "203",
    itemName: "Mini Bar - Snacks",
    quantity: 8,
    unitCost: 150,
    totalCost: 1200,
    restockedBy: "James Otieno"
  }
];

export const mockMonthlyFinance: MonthlyFinance[] = [
  { month: "Aug 2023", income: 850000, expenses: 420000, profit: 430000 },
  { month: "Sep 2023", income: 920000, expenses: 380000, profit: 540000 },
  { month: "Oct 2023", income: 1050000, expenses: 450000, profit: 600000 },
  { month: "Nov 2023", income: 1180000, expenses: 520000, profit: 660000 },
  { month: "Dec 2023", income: 1450000, expenses: 680000, profit: 770000 },
  { month: "Jan 2024", income: 980000, expenses: 410000, profit: 570000 }
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
