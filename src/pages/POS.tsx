import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { POSItemCard } from "@/components/pos/POSItemCard";
import { CartPanel } from "@/components/pos/CartPanel";
import { TransactionList } from "@/components/pos/TransactionList";
import { StatCard } from "@/components/dashboard/StatCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePOSItems, usePOSTransactions, useCreatePOSTransaction, POSItem, CartItem } from "@/hooks/usePOS";
import { useBookings, useGuests } from "@/hooks/useGuests";
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: posItems = [], isLoading: itemsLoading } = usePOSItems();
  const { data: transactions = [], isLoading: transactionsLoading } = usePOSTransactions();
  const { data: bookings = [] } = useBookings();
  const { data: guests = [] } = useGuests();
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

  const categories = [...new Set(posItems.map(item => item.category))];
  
  const filteredItems = posItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory && item.is_available;
  });

  const addToCart = (item: POSItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
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
        items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price * i.quantity })),
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
  }));

  // Convert items for POSItemCard
  const posItemCardData = filteredItems.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category as any,
    price: item.price,
    description: item.description || '',
    available: item.is_available,
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
                    {posItemCardData.map((item) => (
                      <POSItemCard 
                        key={item.id} 
                        item={item}
                        onAddToCart={() => {
                          const fullItem = posItems.find(i => i.id === item.id);
                          if (fullItem) addToCart(fullItem);
                        }}
                      />
                    ))}
                  </div>

                  {posItemCardData.length === 0 && (
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
                  onCheckout={handleCheckout}
                  onClearCart={clearCart}
                  roomOptions={roomOptions}
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
