import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { StockAlertCard } from "@/components/inventory/StockAlertCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockInventoryItems, getStockAlerts, getStockLevel } from "@/data/mockInventory";
import { InventoryItem } from "@/types/inventory";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  PackageCheck, 
  PackageX,
  TrendingDown
} from "lucide-react";

const Inventory = () => {
  const [items, setItems] = useState(mockInventoryItems);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const alerts = useMemo(() => getStockAlerts(items), [items]);

  const stats = useMemo(() => ({
    total: items.length,
    lowStock: items.filter(i => getStockLevel(i) === 'low').length,
    outOfStock: items.filter(i => getStockLevel(i) === 'out-of-stock').length,
    totalValue: items.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0),
  }), [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(lowerSearch) ||
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
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            currentStock: Math.max(0, item.currentStock + adjustment),
            lastRestocked: adjustment > 0 ? new Date().toISOString().split('T')[0] : item.lastRestocked
          } 
        : item
    ));
  };

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
          <Button className="gap-2">
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
              <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
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
                  <TabsTrigger value="bedroom">Bedroom</TabsTrigger>
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
    </MainLayout>
  );
};

export default Inventory;
