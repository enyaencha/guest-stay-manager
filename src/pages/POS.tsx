import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { POSItemCard } from "@/components/pos/POSItemCard";
import { CartPanel } from "@/components/pos/CartPanel";
import { TransactionList } from "@/components/pos/TransactionList";
import { StatCard } from "@/components/dashboard/StatCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPOSItems, mockTransactions } from "@/data/mockPOS";
import { POSItem, CartItem, Transaction, PaymentMethod } from "@/types/pos";
import { 
  ShoppingCart, 
  DollarSign, 
  Receipt, 
  TrendingUp,
  Search
} from "lucide-react";
import { toast } from "sonner";

const POS = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const todayRevenue = transactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + t.total, 0);

  const stats = {
    todayRevenue,
    totalTransactions: transactions.length,
    avgTicket: transactions.length > 0 ? todayRevenue / transactions.filter(t => t.status === "completed").length : 0,
    itemsInCart: cart.reduce((sum, item) => sum + item.quantity, 0),
  };

  const filteredItems = mockPOSItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
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

  const handleCheckout = (roomNumber: string, paymentMethod: PaymentMethod) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    const newTransaction: Transaction = {
      id: `txn${Date.now()}`,
      roomNumber,
      guestName: `Guest - Room ${roomNumber}`,
      items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price * i.quantity })),
      subtotal,
      tax,
      total,
      paymentMethod,
      status: "completed",
      createdAt: new Date().toISOString(),
      staffName: "Current Staff",
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setCart([]);
    toast.success(`Transaction completed! Total: $${total.toFixed(2)}`);
  };

  const clearCart = () => {
    setCart([]);
    toast.info("Cart cleared");
  };

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
            value={`$${stats.todayRevenue.toFixed(2)}`}
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
            value={`$${stats.avgTicket.toFixed(2)}`}
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

        {/* Main Content */}
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
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="food-beverage">Food & Beverage</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="experiences">Experiences</TabsTrigger>
                <TabsTrigger value="packages">Packages</TabsTrigger>
              </TabsList>

              <TabsContent value={categoryFilter} className="mt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredItems.map((item) => (
                    <POSItemCard 
                      key={item.id} 
                      item={item}
                      onAddToCart={addToCart}
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
            <TransactionList transactions={transactions.slice(0, 5)} />
          </div>

          {/* Cart Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <CartPanel 
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onCheckout={handleCheckout}
                onClearCart={clearCart}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default POS;
