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
import { usePropertySettings } from "@/hooks/useSettings";
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
  const { data: propertySettings } = usePropertySettings();
  const updateInventory = useUpdateInventoryItem();
  const updateLot = useUpdateInventoryLot();
  const createInventoryTx = useCreateInventoryTransaction();
  const createTransaction = useCreatePOSTransaction();
  const createLineId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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

  const getLotsForItem = (inventoryItemId: string | null) => {
    if (!inventoryItemId) return [];
    return inventoryLots.filter((lot) => lot.inventory_item_id === inventoryItemId);
  };

  const getSortedLotsForItem = (inventoryItemId: string | null) => {
    return getLotsForItem(inventoryItemId)
      .filter((lot) => lot.quantity > 0)
      .sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return a.expiry_date.localeCompare(b.expiry_date);
      });
  };

  const getLotTotalQty = (inventoryItemId: string | null) => {
    if (!inventoryItemId) return null;
    return getLotsForItem(inventoryItemId).reduce(
      (sum, lot) => sum + Number(lot.quantity || 0),
      0
    );
  };

  const getBrandLabelForItem = (item: POSItem) => {
    if (!item.inventory_item_id) return null;
    const lotBrands = getLotsForItem(item.inventory_item_id)
      .map((lot) => lot.brand)
      .filter((brand) => typeof brand === "string" && brand.trim().length > 0)
      .map((brand) => brand.trim());
    const inventoryBrand =
      inventoryItems.find((inv) => inv.id === item.inventory_item_id)?.brand || null;
    const merged = [...lotBrands, ...(inventoryBrand ? [inventoryBrand] : [])];
    const unique = Array.from(new Set(merged));
    if (unique.length === 0) return null;
    const max = 3;
    if (unique.length > max) {
      return `${unique.slice(0, max).join(", ")} +${unique.length - max}`;
    }
    return unique.join(", ");
  };

  const getCartQtyForLot = (
    lotId: string,
    cartState: CartItem[] = cart,
    excludeLineId?: string
  ) =>
    cartState
      .filter((line) => line.inventory_lot_id === lotId && line.lineId !== excludeLineId)
      .reduce((sum, line) => sum + line.quantity, 0);

  const getCartQtyForItem = (
    itemId: string,
    cartState: CartItem[] = cart,
    excludeLineId?: string
  ) =>
    cartState
      .filter((line) => line.id === itemId && line.lineId !== excludeLineId)
      .reduce((sum, line) => sum + line.quantity, 0);

  const getLotRemaining = (
    lotId: string,
    cartState: CartItem[] = cart,
    excludeLineId?: string
  ) => {
    const lot = inventoryLots.find((l) => l.id === lotId);
    if (!lot) return 0;
    return Math.max(0, lot.quantity - getCartQtyForLot(lotId, cartState, excludeLineId));
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
      stock_quantity: inventoryItem ? (lotQty ?? inventoryItem.current_stock) : item.stock_quantity,
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
      stock_quantity: getLotTotalQty(inv.id) ?? inv.current_stock,
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

  const getDefaultLotForItem = (inventoryItemId: string | null, cartState: CartItem[] = cart) => {
    if (!inventoryItemId) return null;
    const lots = getSortedLotsForItem(inventoryItemId);
    return lots.find((lot) => getLotRemaining(lot.id, cartState) > 0) || null;
  };

  const getActiveLotForItem = (inventoryItemId: string | null, lotId?: string | null) => {
    if (!inventoryItemId) return null;
    if (lotId) {
      return inventoryLots.find((lot) => lot.id === lotId) || null;
    }
    return getDefaultLotForItem(inventoryItemId);
  };

  const addQuantityAcrossLots = (
    item: POSItem,
    quantity: number,
    baseCart: CartItem[] = cart,
    excludeLotIds: Set<string> = new Set()
  ) => {
    let remaining = quantity;
    const nextCart = [...baseCart];

    if (!item.inventory_item_id) {
      const maxAvailable =
        typeof item.stock_quantity === "number" ? item.stock_quantity : null;
      const currentQty = getCartQtyForItem(item.id, nextCart);
      const allowable = maxAvailable === null ? remaining : Math.max(0, maxAvailable - currentQty);
      const toAdd = Math.min(remaining, allowable);
      if (toAdd > 0) {
        const existingIndex = nextCart.findIndex(
          (line) => line.id === item.id && !line.inventory_lot_id
        );
        if (existingIndex >= 0) {
          const existing = nextCart[existingIndex];
          nextCart[existingIndex] = { ...existing, quantity: existing.quantity + toAdd };
        } else {
          nextCart.push({
            ...(item as CartItem),
            lineId: createLineId(),
            quantity: toAdd,
          });
        }
        remaining -= toAdd;
      }
      return { nextCart, remaining };
    }

    const lots = getSortedLotsForItem(item.inventory_item_id).filter(
      (lot) => !excludeLotIds.has(lot.id)
    );
    for (const lot of lots) {
      if (remaining <= 0) break;
      const available = getLotRemaining(lot.id, nextCart);
      if (available <= 0) continue;
      const toAdd = Math.min(available, remaining);
      const existingIndex = nextCart.findIndex(
        (line) => line.id === item.id && line.inventory_lot_id === lot.id
      );
      if (existingIndex >= 0) {
        const existing = nextCart[existingIndex];
        nextCart[existingIndex] = { ...existing, quantity: existing.quantity + toAdd };
      } else {
        nextCart.push({
          ...(item as CartItem),
          lineId: createLineId(),
          quantity: toAdd,
          inventory_lot_id: lot.id,
          lot_label: `${lot.brand}${lot.batch_code ? ` · ${lot.batch_code}` : ""}`,
          lot_expiry: lot.expiry_date || null,
        });
      }
      remaining -= toAdd;
    }

    return { nextCart, remaining };
  };

  const addToCart = (item: POSItem) => {
    const { nextCart, remaining } = addQuantityAcrossLots(item, 1);
    if (remaining > 0) {
      toast.error(`${item.name} is out of stock.`);
      return;
    }
    setCart(nextCart);
    toast.success(`Added ${item.name} to cart`);
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    const target = cart.find((item) => item.lineId === lineId);
    if (!target) return;

    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.lineId !== lineId));
      return;
    }

    if (target.inventory_item_id) {
      const lot = getActiveLotForItem(target.inventory_item_id, target.inventory_lot_id);
      if (!lot) {
        toast.error(`No available lot for ${target.name}.`);
        setCart((prev) => prev.filter((i) => i.lineId !== lineId));
        return;
      }
      const maxAvailable = Math.max(
        0,
        lot.quantity - getCartQtyForLot(lot.id, cart, target.lineId)
      );
      if (quantity <= maxAvailable) {
        setCart((prev) =>
          prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i))
        );
        return;
      }

      const capped = Math.max(0, maxAvailable);
      let nextCart = cart
        .map((i) => (i.lineId === lineId ? { ...i, quantity: capped } : i))
        .filter((i) => i.quantity > 0);

      const overflow = quantity - capped;
      if (overflow > 0) {
        const allocation = addQuantityAcrossLots(
          target,
          overflow,
          nextCart,
          new Set([lot.id])
        );
        nextCart = allocation.nextCart.filter((i) => i.quantity > 0);
        if (allocation.remaining > 0) {
          toast.warning(`Only ${quantity - allocation.remaining} available for ${target.name}.`);
        }
      }
      setCart(nextCart);
      return;
    }

    const maxAvailable =
      typeof target.stock_quantity === "number"
        ? Math.max(
            0,
            target.stock_quantity - getCartQtyForItem(target.id, cart, target.lineId)
          )
        : null;
    let nextQuantity = quantity;
    if (maxAvailable !== null && quantity > maxAvailable) {
      nextQuantity = maxAvailable;
      toast.warning(`Only ${maxAvailable} available for ${target.name}.`);
    }
    if (nextQuantity <= 0) {
      setCart((prev) => prev.filter((i) => i.lineId !== lineId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, quantity: nextQuantity } : i))
    );
  };

  const updateLotSelection = (lineId: string, lotId: string | null) => {
    const lot = lotId ? inventoryLots.find((l) => l.id === lotId) : null;
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.lineId !== lineId) return i;
          const activeLot = lot || getDefaultLotForItem(i.inventory_item_id, prev);
          if (!activeLot) {
            toast.error(`No available lot for ${i.name}.`);
            return { ...i, quantity: 0 };
          }
          const maxAvailable = Math.max(
            0,
            activeLot.quantity - getCartQtyForLot(activeLot.id, prev, i.lineId)
          );
          const nextQuantity = Math.min(i.quantity, maxAvailable);
          if (i.quantity > nextQuantity) {
            toast.warning(`Adjusted ${i.name} to ${nextQuantity} based on selected lot stock.`);
          }
          return {
            ...i,
            quantity: nextQuantity,
            inventory_lot_id: lotId,
            lot_label: lot
              ? `${lot.brand}${lot.batch_code ? ` · ${lot.batch_code}` : ""}`
              : null,
            lot_expiry: lot?.expiry_date || null,
          };
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (lineId: string) => {
    setCart(prev => prev.filter(i => i.lineId !== lineId));
  };

  const handleCheckout = async (
    selection: { roomNumber?: string; guestId?: string; guestName?: string },
    paymentMethod: PaymentMethod
  ) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    try {
      const lotTotals = new Map<string, number>();
      const itemTotals = new Map<string, number>();
      for (const item of cart) {
        if (item.inventory_item_id) {
          const inventoryItem = inventoryItems.find((inv) => inv.id === item.inventory_item_id);
          if (!inventoryItem) {
            toast.error(`Inventory item not found for ${item.name}.`);
            return;
          }
          const lot = getActiveLotForItem(item.inventory_item_id, item.inventory_lot_id);
          if (!lot || lot.quantity < item.quantity) {
            toast.error(`Not enough stock in selected lot for ${item.name}.`);
            return;
          }
          const lotTotal = (lotTotals.get(lot.id) || 0) + item.quantity;
          if (lotTotal > lot.quantity) {
            toast.error(`Not enough stock in selected lot for ${item.name}.`);
            return;
          }
          lotTotals.set(lot.id, lotTotal);
        } else if (typeof item.stock_quantity === "number" && item.quantity > item.stock_quantity) {
          toast.error(`Only ${item.stock_quantity} available for ${item.name}.`);
          return;
        } else {
          const itemTotal = (itemTotals.get(item.id) || 0) + item.quantity;
          if (typeof item.stock_quantity === "number" && itemTotal > item.stock_quantity) {
            toast.error(`Only ${item.stock_quantity} available for ${item.name}.`);
            return;
          }
          itemTotals.set(item.id, itemTotal);
        }
      }

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
      for (const item of cart) {
        if (!item.inventory_item_id) continue;
        const inventoryItem = inventoryItems.find((inv) => inv.id === item.inventory_item_id);
        if (!inventoryItem) continue;
        const lot = getActiveLotForItem(item.inventory_item_id, item.inventory_lot_id);
        if (!lot) continue;
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
      setCart([]);
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
    id: item.lineId,
    lineId: item.lineId,
    itemId: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    category: item.category as any,
    description: item.description || '',
    available: item.is_available,
    stockQuantity: item.stock_quantity ?? undefined,
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

  const applyPropertySettings = propertySettings?.apply_settings ?? true;
  const vatRatePercent = applyPropertySettings ? propertySettings?.vat_rate ?? 10 : 10;

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
                    {filteredItems.map((item) => {
                      const stockQuantity = item.inventory_item_id
                        ? getLotTotalQty(item.inventory_item_id)
                        : item.stock_quantity;
                      const lotCount = item.inventory_item_id
                        ? getLotsForItem(item.inventory_item_id).length
                        : undefined;
                      const brandLabel = getBrandLabelForItem(item) || undefined;
                      return (
                        <POSItemCard 
                          key={item.id} 
                          item={item}
                          stockQuantity={stockQuantity ?? undefined}
                          lotCount={lotCount}
                          brandLabel={brandLabel}
                          onAddToCart={canCreate ? addToCart : undefined}
                        />
                      );
                    })}
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
          taxRatePercent={vatRatePercent}
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
