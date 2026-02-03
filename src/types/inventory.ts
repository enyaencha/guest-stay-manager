export type SupplyCategory = 'bathroom' | 'bedroom' | 'kitchen' | 'cleaning' | 'amenities' | 'maintenance' | 'beverages' | 'medical' | 'toiletries' | string;
export type StockLevel = 'out-of-stock' | 'low' | 'adequate' | 'full';

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  category: SupplyCategory;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitCost: number;
  sellingPrice?: number; // For items sold over the counter
  lastRestocked?: string;
  supplier?: string;
  // Stock tracking fields from Excel
  openingStock?: number;
  purchasesIn?: number;
  stockOut?: number;
}

export interface StockAlert {
  id: string;
  itemId: string;
  itemName: string;
  category: SupplyCategory;
  currentStock: number;
  minStock: number;
  level: 'warning' | 'critical';
  createdAt: string;
}

// Stock movement tracking
export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  brand: string;
  type: 'purchase' | 'sale' | 'room-use' | 'adjustment';
  quantity: number;
  unitCost: number;
  totalValue: number;
  date: string;
  reference?: string; // Room number, receipt number, etc.
  notes?: string;
}

// Stock summary for reporting
export interface StockSummary {
  openingStockUnits: number;
  openingStockValue: number;
  purchasesUnits: number;
  purchasesValue: number;
  stockOutUnits: number;
  stockOutSalesValue: number;
  closingBalanceUnits: number;
  closingBalanceValue: number;
}
