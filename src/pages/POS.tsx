import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { POSItemCard } from "@/components/pos/POSItemCard";
import { CartPanel } from "@/components/pos/CartPanel";
import { TransactionList } from "@/components/pos/TransactionList";
import { StatCard } from "@/components/dashboard/StatCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePOSItems, usePOSTransactions, useCreatePOSTransaction, POSItem, CartItem } from "@/hooks/usePOS";
import { useBookings, useGuests } from "@/hooks/useGuests";
import { useInventoryItems, useInventoryLots, useUpdateInventoryItem, useUpdateInventoryLot, useCreateInventoryTransaction } from "@/hooks/useInventory";
import { PaymentMethod } from "@/types/pos";
import { 
  ShoppingCart, 
  DollarSign, 
  Receipt, 
  TrendingUp,
  Search,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { formatKsh } from "@/lib/formatters";

const POS = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("pos.create");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: posItems = [], isLoading: itemsLoading } = usePOSItems();
  const { data: transactions = [], isLoading: transactionsLoading } = usePOSTransactions();
  const { data: bookings = [] } = useBookings();
  const { data: guests = [] } = useGuests();
  const { data: inventoryItems = [] } = useInventoryItems();
  const { data: inventoryLots = [] } = useInventoryLots();
  const updateInventory = useUpdateInventoryItem();
  const updateLot = useUpdateInventoryLot();
  const createInventoryTx = useCreateInventoryTransaction();
  const createTransaction = useCreatePOSTransaction();

  const todayRevenue = transactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.total, 0);

  const completedTransactions = transactions.filter(t => t.status === "completed");
  const stats = {
    todayRevenue,
    totalTransactions: transactions.length,
    avgTicket: completedTransactions.length > 0 ? todayRevenue / completedTransactions.length : 0,
    itemsInCart: cart.reduce((sum, item) => sum + item.quantity, 0),
  };

  const mapInventoryCategoryToPOS = (category: string) => {
    switch (category) {
      case "beverages":
        return "beverages";
      case "health":
      case "medical":
        return "health";
      case "amenities":
      case "bathroom":
      case "toiletries":
        return "amenities";
      case "kitchen":
      case "food":
      case "food-beverage":
        return "food-beverage";
      case "services":
      case "maintenance":
      default:
        return "services";
    }
  };

  const getLotTotalQty = (inventoryItemId: string | null) => {
    if (!inventoryItemId) return null;
    return inventoryLots
      .filter((lot) => lot.inventory_item_id === inventoryItemId)
      .reduce((sum, lot) => sum + Number(lot.quantity || 0), 0);
  };

  const enrichedPosItems = posItems.map((item) => {
    const inventoryItem = item.inventory_item_id
      ? inventoryItems.find((inv) => inv.id === item.inventory_item_id)
      : null;
    const lotQty = inventoryItem ? getLotTotalQty(inventoryItem.id) : null;
    return {
      ...item,
      price: inventoryItem?.selling_price ?? item.price,
      cost: inventoryItem?.unit_cost ?? item.cost,
      stock_quantity: inventoryItem?.current_stock ?? item.stock_quantity,
      is_available: inventoryItem ? (lotQty || 0) > 0 : item.is_available,
    };
  });

  const inventoryDerivedItems = inventoryItems
    .filter((inv) => inv.selling_price !== null && inv.selling_price !== undefined)
    .filter((inv) => !posItems.some((p) => p.inventory_item_id === inv.id))
    .map((inv) => ({
      id: `inv-${inv.id}`,
      name: inv.name,
      category: mapInventoryCategoryToPOS(inv.category),
      price: inv.selling_price || 0,
      cost: inv.unit_cost,
      description: inv.supplier,
      inventory_item_id: inv.id,
      stock_quantity: inv.current_stock,
      is_available: (getLotTotalQty(inv.id) || 0) > 0,
      created_at: inv.created_at,
      updated_at: inv.updated_at,
    }));

  const mergedPosItems = [...enrichedPosItems, ...inventoryDerivedItems];

  const categories = [...new Set(mergedPosItems.map(item => item.category))];
  
  const filteredItems = mergedPosItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory && item.is_available;
  });

  const getDefaultLotForItem = (inventoryItemId: string | null) => {
    if (!inventoryItemId) return null;
    const lots = inventoryLots
      .filter((lot) => lot.inventory_item_id === inventoryItemId && lot.quantity > 0)
      .sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return a.expiry_date.localeCompare(b.expiry_date);
      });
    return lots[0] || null;
  };

  const addToCart = (item: POSItem) => {
    const defaultLot = getDefaultLotForItem(item.inventory_item_id);
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [
        ...prev,
        {
          ...item,
          quantity: 1,
          inventory_lot_id: defaultLot?.id || null,
          lot_label: defaultLot
            ? `${defaultLot.brand}${defaultLot.batch_code ? ` · ${defaultLot.batch_code}` : ""}`
            : null,
          lot_expiry: defaultLot?.expiry_date || null,
        },
      ];
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(i => i.id !== id));
    } else {
      setCart(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    }
  };

  const updateLotSelection = (id: string, lotId: string | null) => {
    const lot = lotId ? inventoryLots.find((l) => l.id === lotId) : null;
    setCart(prev =>
      prev.map(i =>
        i.id === id
          ? {
              ...i,
              inventory_lot_id: lotId,
              lot_label: lot
                ? `${lot.brand}${lot.batch_code ? ` · ${lot.batch_code}` : ""}`
                : null,
              lot_expiry: lot?.expiry_date || null,
            }
          : i
      )
    );
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckout = async (
    selection: { roomNumber?: string; guestId?: string; guestName?: string },
    paymentMethod: PaymentMethod
  ) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    try {
      const guestName =
        selection.guestName ||
        (selection.roomNumber ? `Guest - Room ${selection.roomNumber}` : "Walk-in Customer");

      const status = paymentMethod === "room-charge" ? "pending" : "completed";

      await createTransaction.mutateAsync({
        room_number: selection.roomNumber || null,
        guest_id: selection.guestId || null,
        guest_name: guestName,
        items: cart.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price * i.quantity,
          lot: i.lot_label || null,
          expiry: i.lot_expiry || null,
        })),
        subtotal,
        tax,
        total,
        payment_method: paymentMethod,
        status,
        staff_id: null,
        staff_name: "Current Staff",
        notes: null,
      });
      setCart([]);
      for (const item of cart) {
        if (!item.inventory_item_id) return;
        const inventoryItem = inventoryItems.find((inv) => inv.id === item.inventory_item_id);
        if (!inventoryItem) return;
        const lot =
          (item.inventory_lot_id &&
            inventoryLots.find((l) => l.id === item.inventory_lot_id)) ||
          getDefaultLotForItem(item.inventory_item_id);
        if (!lot || lot.quantity < item.quantity) {
          toast.error(`Not enough stock in selected lot for ${item.name}.`);
          throw new Error("Insufficient lot stock");
        }
        const quantity = item.quantity;
        updateInventory.mutate({
          id: inventoryItem.id,
          updates: {
            current_stock: Math.max(0, inventoryItem.current_stock - quantity),
            stock_out: (inventoryItem.stock_out || 0) + quantity,
          },
        });
        updateLot.mutate({
          id: lot.id,
          updates: {
            quantity: Math.max(0, lot.quantity - quantity),
          },
        });
        createInventoryTx.mutate({
          inventory_item_id: inventoryItem.id,
          inventory_lot_id: lot.id,
          item_name: inventoryItem.name,
          brand: lot.brand,
          transaction_type: "sale",
          direction: "out",
          quantity,
          unit: inventoryItem.unit,
          unit_cost: inventoryItem.unit_cost,
          total_value: inventoryItem.unit_cost * quantity,
          batch_code: lot.batch_code || null,
          expiry_date: lot.expiry_date || null,
          transaction_date: new Date().toISOString().split("T")[0],
          reference: selection.roomNumber || null,
          notes: "POS sale",
        });
      }
      toast.success(
        status === "pending"
          ? `Transaction saved as pending. Total: ${formatKsh(total)}`
          : `Transaction completed! Total: ${formatKsh(total)}`
      );
    } catch (error) {
      // Error handled by mutation
    }
  };

  const clearCart = () => {
    setCart([]);
    toast.info("Cart cleared");
  };

  const isLoading = itemsLoading || transactionsLoading;

  // Convert transactions for TransactionList component
  const transactionListData = transactions.slice(0, 5).map(t => ({
    id: t.id,
    roomNumber: t.room_number || '',
    guestName: t.guest_name || 'Walk-in Customer',
    items: Array.isArray(t.items) ? (t.items as { name: string; quantity: number; price: number }[]) : [],
    subtotal: t.subtotal,
    tax: t.tax,
    total: t.total,
    paymentMethod: t.payment_method as PaymentMethod,
    status: t.status as 'completed' | 'pending' | 'refunded',
    createdAt: t.created_at,
    staffName: t.staff_name || undefined,
  }));

  // Convert cart items for CartPanel (needs price property)
  const cartPanelItems = cart.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    category: item.category as any,
    description: item.description || '',
    available: item.is_available,
    inventoryItemId: item.inventory_item_id,
    inventoryLotId: item.inventory_lot_id,
    lotLabel: item.lot_label || undefined,
    lotExpiry: item.lot_expiry || undefined,
  }));

  const roomOptions = bookings
    .filter((booking) => booking.status === "checked-in")
    .map((booking) => {
      const guest = guests.find((g) => g.id === booking.guest_id);
      return {
        roomNumber: booking.room_number,
        guestName: guest?.name || "Guest",
        guestId: booking.guest_id || undefined,
        bookingId: booking.id,
        isCheckedIn: true,
      };
    });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground">
            Process upsells, services, and payments
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Revenue"
            value={formatKsh(stats.todayRevenue)}
            icon={DollarSign}
            trend={{ value: 18, isPositive: true }}
            description="From all sales"
          />
          <StatCard
            title="Transactions"
            value={stats.totalTransactions}
            icon={Receipt}
            description="Today's orders"
          />
          <StatCard
            title="Avg. Ticket"
            value={formatKsh(stats.avgTicket)}
            icon={TrendingUp}
            description="Per transaction"
          />
          <StatCard
            title="Cart Items"
            value={stats.itemsInCart}
            icon={ShoppingCart}
            description="Current cart"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Main Content */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Items Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search items..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat} className="capitalize">
                      {cat.replace('-', ' ')}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={categoryFilter} className="mt-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {filteredItems.map((item) => (
                      <POSItemCard 
                        key={item.id} 
                        item={item}
                        onAddToCart={canCreate ? addToCart : undefined}
                      />
                    ))}
                  </div>

                  {filteredItems.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No items found
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Recent Transactions */}
              <TransactionList transactions={transactionListData} />
            </div>

            {/* Cart Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
        <CartPanel 
          items={cartPanelItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onUpdateLot={updateLotSelection}
          onCheckout={handleCheckout}
          onClearCart={clearCart}
          roomOptions={roomOptions}
          lots={inventoryLots}
        />
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default POS;
