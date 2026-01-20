// Expense categories from Purchases 2026.xlsx
// REST PERK LIMITED - Expense & Purchased Items summary report

export type ExpenseCategory = 
  | 'ffe' // Furniture, Fixtures & Equipment
  | 'housekeeping'
  | 'guest_amenities'
  | 'utilities'
  | 'repairs_maintenance'
  | 'fumigation_pest_control'
  | 'cleaning_supplies'
  | 'administration'
  | 'staff_costs'
  | 'licenses_fees_compliance'
  | 'transport'
  | 'miscellaneous'
  | 'compound_cleaning';

export interface ExpenseRecord {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  totalCost: number;
  etimsAmount: number; // eTIMS registered amount
  nonEtimsAmount: number; // Non-eTIMS amount
  supplier?: string;
  reference?: string;
  paymentMethod: 'cash' | 'mpesa' | 'bank_transfer' | 'credit';
  status: 'paid' | 'pending' | 'partial';
}

export interface MonthlyExpenseSummary {
  month: string;
  year: number;
  categories: {
    category: ExpenseCategory;
    totalCost: number;
    etimsAmount: number;
    nonEtimsAmount: number;
  }[];
  totalCost: number;
  totalEtims: number;
  totalNonEtims: number;
}

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  ffe: 'Furniture, Fixtures & Equipment (FFE)',
  housekeeping: 'Housekeeping',
  guest_amenities: 'Guest Amenities',
  utilities: 'Utilities',
  repairs_maintenance: 'Repairs & Maintenance',
  fumigation_pest_control: 'Fumigation & Pest Control',
  cleaning_supplies: 'Cleaning Supplies',
  administration: 'Administration',
  staff_costs: 'Staff Costs',
  licenses_fees_compliance: 'Licenses, Fees & Compliance',
  transport: 'Transport',
  miscellaneous: 'Miscellaneous',
  compound_cleaning: 'General Compound Cleaning',
};

// Sample expense records (to be populated from actual data)
export const mockExpenseRecords: ExpenseRecord[] = [
  {
    id: 'exp-001',
    date: '2026-01-05',
    category: 'guest_amenities',
    description: 'Sawa Soap restock - 432 pieces',
    totalCost: 2655,
    etimsAmount: 2655,
    nonEtimsAmount: 0,
    supplier: 'Wholesale Supplier',
    paymentMethod: 'mpesa',
    status: 'paid',
  },
  {
    id: 'exp-002',
    date: '2026-01-02',
    category: 'guest_amenities',
    description: 'Water 500ML - 48 bottles',
    totalCost: 800,
    etimsAmount: 800,
    nonEtimsAmount: 0,
    supplier: 'Beverage Supplier',
    paymentMethod: 'cash',
    status: 'paid',
  },
  {
    id: 'exp-003',
    date: '2026-01-16',
    category: 'guest_amenities',
    description: 'Trust Condoms - 48 packs',
    totalCost: 1180,
    etimsAmount: 1180,
    nonEtimsAmount: 0,
    supplier: 'Pharmacy Supplier',
    paymentMethod: 'mpesa',
    status: 'paid',
  },
  {
    id: 'exp-004',
    date: '2026-01-16',
    category: 'guest_amenities',
    description: 'Vaseline - 24 pieces',
    totalCost: 920,
    etimsAmount: 920,
    nonEtimsAmount: 0,
    supplier: 'Pharmacy Supplier',
    paymentMethod: 'mpesa',
    status: 'paid',
  },
  {
    id: 'exp-005',
    date: '2026-01-10',
    category: 'utilities',
    description: 'Electricity bill - January',
    totalCost: 15000,
    etimsAmount: 15000,
    nonEtimsAmount: 0,
    supplier: 'Kenya Power',
    reference: 'KPLC-2026-01',
    paymentMethod: 'bank_transfer',
    status: 'paid',
  },
  {
    id: 'exp-006',
    date: '2026-01-10',
    category: 'utilities',
    description: 'Water bill - January',
    totalCost: 8500,
    etimsAmount: 8500,
    nonEtimsAmount: 0,
    supplier: 'Nairobi Water',
    reference: 'NWS-2026-01',
    paymentMethod: 'bank_transfer',
    status: 'paid',
  },
  {
    id: 'exp-007',
    date: '2026-01-15',
    category: 'cleaning_supplies',
    description: 'Cleaning chemicals and supplies',
    totalCost: 4500,
    etimsAmount: 4500,
    nonEtimsAmount: 0,
    supplier: 'Cleaning Supplies Ltd',
    paymentMethod: 'mpesa',
    status: 'paid',
  },
  {
    id: 'exp-008',
    date: '2026-01-08',
    category: 'repairs_maintenance',
    description: 'Plumbing repairs - Room G5',
    totalCost: 3500,
    etimsAmount: 0,
    nonEtimsAmount: 3500,
    supplier: 'Local Plumber',
    paymentMethod: 'cash',
    status: 'paid',
  },
  {
    id: 'exp-009',
    date: '2026-01-20',
    category: 'staff_costs',
    description: 'Staff salaries - January',
    totalCost: 85000,
    etimsAmount: 85000,
    nonEtimsAmount: 0,
    reference: 'SAL-2026-01',
    paymentMethod: 'bank_transfer',
    status: 'pending',
  },
  {
    id: 'exp-010',
    date: '2026-01-12',
    category: 'administration',
    description: 'Office supplies and stationery',
    totalCost: 2800,
    etimsAmount: 2800,
    nonEtimsAmount: 0,
    supplier: 'Office Mart',
    paymentMethod: 'mpesa',
    status: 'paid',
  },
];

// Calculate expense summary
export const calculateExpenseSummary = (expenses: ExpenseRecord[]) => {
  const totalCost = expenses.reduce((sum, e) => sum + e.totalCost, 0);
  const totalEtims = expenses.reduce((sum, e) => sum + e.etimsAmount, 0);
  const totalNonEtims = expenses.reduce((sum, e) => sum + e.nonEtimsAmount, 0);
  const pendingAmount = expenses
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.totalCost, 0);

  return {
    totalCost,
    totalEtims,
    totalNonEtims,
    pendingAmount,
    paidAmount: totalCost - pendingAmount,
    etimsPercentage: totalCost > 0 ? Math.round((totalEtims / totalCost) * 100) : 0,
  };
};

// Group expenses by category
export const groupExpensesByCategory = (expenses: ExpenseRecord[]) => {
  const grouped: Record<ExpenseCategory, { count: number; total: number }> = {} as any;
  
  expenses.forEach(expense => {
    if (!grouped[expense.category]) {
      grouped[expense.category] = { count: 0, total: 0 };
    }
    grouped[expense.category].count++;
    grouped[expense.category].total += expense.totalCost;
  });

  return Object.entries(grouped)
    .map(([category, data]) => ({
      category: category as ExpenseCategory,
      label: expenseCategoryLabels[category as ExpenseCategory],
      ...data,
    }))
    .sort((a, b) => b.total - a.total);
};
