import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryTransactionsTable } from "@/components/inventory/InventoryTransactionsTable";
import { AddInventoryItemModal } from "@/components/inventory/AddInventoryItemModal";
import { StockAlertCard } from "@/components/inventory/StockAlertCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryItems, useUpdateInventoryItem, useCreateInventoryTransaction, useInventoryTransactions, getStockAlerts, getStockLevel, InventoryItem as DBItem } from "@/hooks/useInventory";
import { InventoryItem } from "@/types/inventory";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  PackageCheck, 
  PackageX,
  TrendingDown,
  Loader2
} from "lucide-react";

// Map database item to legacy format
const mapToLegacyItem = (item: DBItem): InventoryItem => ({
  id: item.id,
  name: item.name,
  brand: item.brand,
  category: item.category as InventoryItem['category'],
  sku: item.sku || '',
  currentStock: item.current_stock,
  minStock: item.min_stock,
  maxStock: item.max_stock,
  unit: item.unit,
  unitCost: item.unit_cost,
  sellingPrice: item.selling_price || undefined,
  lastRestocked: item.last_restocked || '',
  supplier: item.supplier || undefined,
  openingStock: item.opening_stock || undefined,
  purchasesIn: item.purchases_in || undefined,
  stockOut: item.stock_out || undefined,
});

const Inventory = () => {
  const { data: dbItems, isLoading } = useInventoryItems();
  const { data: inventoryTransactions = [] } = useInventoryTransactions();
  const updateItem = useUpdateInventoryItem();
  const createInventoryTx = useCreateInventoryTransaction();
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const items = useMemo(() => {
    if (!dbItems) return [];
    return dbItems.map(mapToLegacyItem);
  }, [dbItems]);

  const alerts = useMemo(() => {
    if (!dbItems) return [];
    return getStockAlerts(dbItems);
  }, [dbItems]);

  const stats = useMemo(() => {
    const legacyItems = items.map(i => ({
      ...i,
      current_stock: i.currentStock,
      min_stock: i.minStock,
      max_stock: i.maxStock,
    }));
    return {
      total: items.length,
      lowStock: legacyItems.filter(i => getStockLevel(i as any) === 'low').length,
      outOfStock: legacyItems.filter(i => getStockLevel(i as any) === 'out-of-stock').length,
      totalValue: items.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(lowerSearch) ||
        i.brand.toLowerCase().includes(lowerSearch) ||
        i.sku.toLowerCase().includes(lowerSearch) ||
        i.supplier?.toLowerCase().includes(lowerSearch)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category === categoryFilter);
    }

    return result;
  }, [items, search, categoryFilter]);

  const handleAdjustStock = (itemId: string, adjustment: number) => {
    const item = dbItems?.find(i => i.id === itemId);
    if (!item) return;

    updateItem.mutate({
      id: itemId,
      updates: {
        current_stock: Math.max(0, item.current_stock + adjustment),
        last_restocked: adjustment > 0 ? new Date().toISOString().split('T')[0] : item.last_restocked,
      },
    });

    createInventoryTx.mutate({
      inventory_item_id: item.id,
      item_name: item.name,
      brand: item.brand,
      transaction_type: adjustment >= 0 ? "purchase" : "adjustment",
      direction: adjustment >= 0 ? "in" : "out",
      quantity: Math.abs(adjustment),
      unit: item.unit,
      unit_cost: item.unit_cost,
      total_value: item.unit_cost * Math.abs(adjustment),
      reference: null,
      notes: "Manual adjustment",
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory & Supplies</h1>
            <p className="text-muted-foreground">
              Track stock levels and manage supplies
            </p>
          </div>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-status-maintenance/10">
              <TrendingDown className="h-5 w-5 text-status-maintenance" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.lowStock}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-destructive/10">
              <PackageX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.outOfStock}</p>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-2 rounded-lg bg-status-available/10">
              <PackageCheck className="h-5 w-5 text-status-available" />
            </div>
            <div>
              <p className="text-2xl font-bold">Ksh {stats.totalValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Inventory Value</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Inventory Table */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search items, SKUs, suppliers..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="bathroom">Bathroom</TabsTrigger>
                  <TabsTrigger value="amenities">Amenities</TabsTrigger>
                  <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
                  <TabsTrigger value="cleaning">Cleaning</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <InventoryTable items={filteredItems} onAdjustStock={handleAdjustStock} />

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No items found
              </div>
            )}

            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Inventory Transactions</h2>
                <span className="text-xs text-muted-foreground">Latest updates</span>
              </div>
              <InventoryTransactionsTable transactions={inventoryTransactions.slice(0, 50)} />
            </div>
          </div>

          {/* Alerts Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-maintenance" />
              <h2 className="font-semibold">Stock Alerts</h2>
            </div>
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map(alert => (
                  <StockAlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground bg-card rounded-lg border">
                No stock alerts
              </div>
            )}
          </div>
        </div>
      </div>

      <AddInventoryItemModal open={addOpen} onOpenChange={setAddOpen} />
    </MainLayout>
  );
};

export default Inventory;
