import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryTransactionsTable } from "@/components/inventory/InventoryTransactionsTable";
import { AddInventoryItemModal } from "@/components/inventory/AddInventoryItemModal";
import { InventoryAdjustmentModal } from "@/components/inventory/InventoryAdjustmentModal";
import { StockAlertCard } from "@/components/inventory/StockAlertCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryItems, useInventoryLots, useUpdateInventoryItem, useCreateInventoryLot, useUpdateInventoryLot, useCreateInventoryTransaction, useInventoryTransactions, getStockAlerts, getStockLevel, InventoryItem as DBItem } from "@/hooks/useInventory";
import { InventoryItem } from "@/types/inventory";
import { formatKsh } from "@/lib/formatters";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  PackageCheck, 
  PackageX,
  TrendingDown,
  Layers,
  ArrowUpRight,
  Loader2,
  BarChart3
} from "lucide-react";

const mapToLegacyItem = (item: DBItem): InventoryItem => ({
  id: item.id, name: item.name, brand: item.brand || undefined,
  category: item.category as InventoryItem['category'],
  sku: item.sku || '', currentStock: item.current_stock,
  minStock: item.min_stock, maxStock: item.max_stock, unit: item.unit,
  unitCost: item.unit_cost, sellingPrice: item.selling_price || undefined,
  lastRestocked: item.last_restocked || '', supplier: item.supplier || undefined,
  openingStock: item.opening_stock || undefined,
  purchasesIn: item.purchases_in || undefined, stockOut: item.stock_out || undefined,
});

const Inventory = () => {
  const { hasPermission } = useAuth();
  const { data: dbItems, isLoading } = useInventoryItems();
  const { data: inventoryLots = [] } = useInventoryLots();
  const { data: inventoryTransactions = [] } = useInventoryTransactions();
  const updateItem = useUpdateInventoryItem();
  const createLot = useCreateInventoryLot();
  const updateLot = useUpdateInventoryLot();
  const createInventoryTx = useCreateInventoryTransaction();
  
  const canCreate = hasPermission("inventory.create");
  const canManage = hasPermission("inventory.manage");
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("items");
  const [addOpen, setAddOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItemId, setAdjustItemId] = useState<string | null>(null);
  const [adjustType, setAdjustType] = useState<"purchase" | "adjustment">("purchase");
  const [adjustDirection, setAdjustDirection] = useState<"in" | "out">("in");

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
      ...i, current_stock: i.currentStock, min_stock: i.minStock, max_stock: i.maxStock,
    }));
    return {
      total: items.length,
      lowStock: legacyItems.filter(i => getStockLevel(i as any) === 'low').length,
      outOfStock: legacyItems.filter(i => getStockLevel(i as any) === 'out-of-stock').length,
      totalValue: items.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0),
    };
  }, [items]);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category));
    return ["all", ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(i => {
        const itemLots = inventoryLots.filter((lot) => lot.inventory_item_id === i.id);
        const lotMatch = itemLots.some((lot) => lot.brand.toLowerCase().includes(lowerSearch));
        return (
          i.name.toLowerCase().includes(lowerSearch) ||
          (i.brand || "").toLowerCase().includes(lowerSearch) ||
          i.sku.toLowerCase().includes(lowerSearch) ||
          i.supplier?.toLowerCase().includes(lowerSearch) || lotMatch
        );
      });
    }
    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category === categoryFilter);
    }
    return result;
  }, [items, search, categoryFilter, inventoryLots]);

  const handleAdjustmentSubmit = async (payload: {
    itemId: string; type: "purchase" | "adjustment"; direction: "in" | "out";
    quantity: number; unitCost: number; lotId?: string | null; lotBrand?: string;
    batchCode?: string; expiryDate?: string; transactionDate: string;
    reference?: string; notes?: string;
  }) => {
    const item = dbItems?.find((i) => i.id === payload.itemId);
    if (!item) return;

    const signedQty = payload.direction === "in" ? payload.quantity : -payload.quantity;
    await updateItem.mutateAsync({
      id: item.id,
      updates: {
        current_stock: Math.max(0, item.current_stock + signedQty),
        last_restocked: payload.direction === "in" ? payload.transactionDate.split("T")[0] : item.last_restocked,
        purchases_in: payload.direction === "in" ? (item.purchases_in || 0) + payload.quantity : item.purchases_in,
        stock_out: payload.direction === "out" ? (item.stock_out || 0) + payload.quantity : item.stock_out,
        unit_cost: payload.unitCost || item.unit_cost,
      },
    });

    let lotId = payload.lotId || null;
    if (!lotId) {
      const lot = await createLot.mutateAsync({
        inventory_item_id: item.id, brand: payload.lotBrand || "Generic",
        batch_code: payload.batchCode || null, expiry_date: payload.expiryDate || null,
        quantity: payload.quantity, unit_cost: payload.unitCost || item.unit_cost,
      });
      lotId = lot.id;
    } else {
      const lot = inventoryLots.find((l) => l.id === lotId);
      if (lot) {
        await updateLot.mutateAsync({
          id: lot.id,
          updates: { quantity: Math.max(0, lot.quantity + signedQty), unit_cost: payload.unitCost || lot.unit_cost },
        });
      }
    }

    createInventoryTx.mutate({
      inventory_item_id: item.id, inventory_lot_id: lotId, item_name: item.name,
      brand: payload.lotBrand || item.brand || "Generic", transaction_type: payload.type,
      direction: payload.direction, quantity: payload.quantity, unit: item.unit,
      unit_cost: payload.unitCost || item.unit_cost,
      total_value: (payload.unitCost || item.unit_cost) * payload.quantity,
      batch_code: payload.batchCode || null, expiry_date: payload.expiryDate || null,
      transaction_date: payload.transactionDate, reference: payload.reference || null,
      notes: payload.notes || null,
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
              <p className="text-sm text-muted-foreground">Manage stock levels and supplies</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(canCreate || canManage) && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                setAdjustItemId(null); setAdjustType("purchase"); setAdjustDirection("in"); setAdjustOpen(true);
              }}>
                <PackageCheck className="h-4 w-4" /> Stock Entry
              </Button>
            )}
            {canCreate && (
              <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-status-cleaning/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-status-cleaning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <PackageX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.outOfStock}</p>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-status-available/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-status-available" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatKsh(stats.totalValue)}</p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <Card className="border-status-cleaning/30 bg-status-cleaning-bg/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-status-cleaning" />
                <h3 className="font-semibold text-sm">Stock Alerts ({alerts.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {alerts.slice(0, 8).map(alert => (
                  <Badge key={alert.id} variant="outline" className="bg-background border-status-cleaning/30 text-foreground text-xs py-1">
                    {alert.itemName}: {alert.currentStock} / {alert.minStock}
                  </Badge>
                ))}
                {alerts.length > 8 && (
                  <Badge variant="secondary" className="text-xs">+{alerts.length - 8} more</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search items, brands, SKU, supplier..." 
              value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className="capitalize text-xs"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="items" className="gap-2">
              <Layers className="h-4 w-4" /> Items ({filteredItems.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <ArrowUpRight className="h-4 w-4" /> Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-4">
            <InventoryTable
              items={filteredItems} lots={inventoryLots}
              onOpenAdjustment={(options) => {
                setAdjustItemId(options.itemId || null);
                setAdjustType(options.type || "purchase");
                setAdjustDirection(options.direction || "in");
                setAdjustOpen(true);
              }}
            />
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No items found</div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="mt-4">
            <InventoryTransactionsTable transactions={inventoryTransactions.slice(0, 100)} />
          </TabsContent>
        </Tabs>
      </div>

      <AddInventoryItemModal open={addOpen} onOpenChange={setAddOpen} />
      <InventoryAdjustmentModal
        open={adjustOpen} onOpenChange={setAdjustOpen} items={dbItems || []}
        lots={inventoryLots} initialItemId={adjustItemId}
        initialType={adjustType} initialDirection={adjustDirection}
        onSubmit={handleAdjustmentSubmit}
      />
    </MainLayout>
  );
};

export default Inventory;
