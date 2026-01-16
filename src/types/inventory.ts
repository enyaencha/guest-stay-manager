export type SupplyCategory = 'bathroom' | 'bedroom' | 'kitchen' | 'cleaning' | 'amenities' | 'maintenance';
export type StockLevel = 'out-of-stock' | 'low' | 'adequate' | 'full';

export interface InventoryItem {
  id: string;
  name: string;
  category: SupplyCategory;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitCost: number;
  lastRestocked?: string;
  supplier?: string;
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
