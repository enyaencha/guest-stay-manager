import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { FinanceOverviewChart } from "@/components/finance/FinanceOverviewChart";
import { CategoryBreakdownCard } from "@/components/finance/CategoryBreakdownCard";
import { TransactionHistoryTable } from "@/components/finance/TransactionHistoryTable";
import { POSSalesTable } from "@/components/finance/POSSalesTable";
import { RoomAmenityCostsTable } from "@/components/finance/RoomAmenityCostsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  BedDouble,
  Loader2
} from "lucide-react";
import { 
  useFinanceTransactions, 
  calculateFinanceSummary, 
  calculateCategoryBreakdown 
} from "@/hooks/useFinance";
import { usePOSTransactions } from "@/hooks/usePOS";
import { formatKsh } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInventoryItems } from "@/hooks/useInventory";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: transactions = [], isLoading: transactionsLoading } = useFinanceTransactions();
  const { data: posTransactions = [], isLoading: posLoading } = usePOSTransactions();
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems();
  
  // Fetch housekeeping tasks to derive actual amenity usage
  const { data: housekeepingTasks = [], isLoading: housekeepingLoading } = useQuery({
    queryKey: ["housekeeping_tasks_costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("housekeeping_tasks")
        .select("id, room_number, assigned_to_name, actual_added, completed_at, updated_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const summary = calculateFinanceSummary(transactions);
  const incomeBreakdown = calculateCategoryBreakdown(transactions, 'income');
  const expenseBreakdown = calculateCategoryBreakdown(transactions, 'expense');

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const totalPOSSales = posTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, s) => sum + s.total, 0);
  const inventoryLookup = new Map(
    inventoryItems.map((item) => [item.name.toLowerCase(), item])
  );

  const roomCostsData = housekeepingTasks.flatMap((task: any) => {
    const addedItems = Array.isArray(task.actual_added) ? task.actual_added : [];
    if (addedItems.length === 0) return [];
    return addedItems.map((amenity: any, index: number) => {
      const inventoryItem = inventoryLookup.get(String(amenity.name || "").toLowerCase());
      const unitCost = inventoryItem ? Number(inventoryItem.unit_cost) : 0;
      const quantity = Number(amenity.quantity ?? 0);
      return {
        id: `${task.id}-${index}`,
        date: task.completed_at || task.updated_at || task.created_at,
        roomNumber: task.room_number,
        itemName: amenity.name || "Unknown item",
        quantity,
        unitCost,
        totalCost: unitCost * quantity,
        isComplimentary: true,
        restockedBy: task.assigned_to_name || "Cleaner",
      };
    });
  });

  const totalAmenityCosts = roomCostsData.reduce((sum, c) => sum + c.totalCost, 0);
  const restockEvents = housekeepingTasks.filter((task: any) =>
    Array.isArray(task.actual_added) && task.actual_added.length > 0
  ).length;

  const isLoading = transactionsLoading || posLoading || inventoryLoading || housekeepingLoading;

  // Convert transactions for table
  const tableTransactions = transactions.map(t => ({
    id: t.id,
    date: t.date,
    type: t.type as 'income' | 'expense',
    category: t.category,
    description: t.description,
    amount: t.amount,
    paymentStatus: t.payment_status as 'paid' | 'pending' | 'overdue',
    paymentMethod: t.payment_method || undefined,
    reference: t.reference || undefined,
    roomNumber: t.room_number || undefined,
    vendor: t.vendor || undefined,
  }));

  // Convert POS transactions for table
  const posSalesData = posTransactions.map(t => ({
    id: t.id,
    date: t.created_at,
    roomNumber: t.room_number || 'Walk-in',
    items: Array.isArray(t.items) ? (t.items as { name: string; quantity: number; price: number }[]).map(i => i.name).join(', ') : '',
    totalAmount: t.total,
    paymentMethod: t.status === "pending" ? `${t.payment_method} (pending)` : t.payment_method,
    staffName: t.staff_name || 'Unknown',
  }));

  // Mock monthly data for chart (we'd need to aggregate this from transactions)
  const monthlyFinance = [
    { month: 'Jan', income: summary.totalIncome, expenses: summary.totalExpenses, profit: summary.netProfit },
  ];

  const kenyaNotes = [
    { label: "Ksh 50", image: "https://source.unsplash.com/1200x800/?kenya,banknote,50" },
    { label: "Ksh 100", image: "https://source.unsplash.com/1200x800/?kenya,banknote,100" },
    { label: "Ksh 200", image: "https://source.unsplash.com/1200x800/?kenya,banknote,200" },
    { label: "Ksh 500", image: "https://source.unsplash.com/1200x800/?kenya,banknote,500" },
    { label: "Ksh 1000", image: "https://source.unsplash.com/1200x800/?kenya,banknote,1000" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Finance</h1>
            <p className="text-muted-foreground">
              Track revenue, expenses, and financial performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Jan 2026
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl border bg-card">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=3200&h=1800&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="relative z-10 p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Kenyan Shilling Series</h2>
                    <p className="text-sm text-muted-foreground">
                      Visual reference for daily withdraw handling and reconciliation.
                    </p>
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-primary w-fit">
                    New Notes
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {kenyaNotes.map((note) => (
                    <div
                      key={note.label}
                      className="group relative overflow-hidden rounded-xl border bg-background/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div
                        className="h-24 sm:h-28"
                        style={{
                          backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.15), rgba(0,0,0,0.25)), url('${note.image}')`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div className="px-3 py-2">
                        <p className="text-xs font-semibold text-foreground">{note.label}</p>
                        <p className="text-[11px] text-muted-foreground">Series 2019</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Income"
                value={formatKsh(summary.totalIncome)}
                subtitle="This month"
                icon={TrendingUp}
                trend={{ value: 12, isPositive: true }}
                iconClassName="text-status-available"
              />
              <StatCard
                title="Total Expenses"
                value={formatKsh(summary.totalExpenses)}
                subtitle="This month"
                icon={TrendingDown}
                trend={{ value: 8, isPositive: false }}
                iconClassName="text-status-maintenance"
              />
              <StatCard
                title="Net Profit"
                value={formatKsh(summary.netProfit)}
                subtitle="This month"
                icon={Wallet}
                trend={{ value: 18, isPositive: true }}
                iconClassName="text-primary"
              />
              <StatCard
                title="Pending Payments"
                value={formatKsh(summary.pendingPayments)}
                subtitle="Awaiting settlement"
                icon={AlertCircle}
                iconClassName="text-status-checkout"
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                <div className="p-2 rounded-lg bg-status-available/10">
                  <Receipt className="h-5 w-5 text-status-available" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">POS Sales</p>
                  <p className="font-semibold text-foreground">{formatKsh(totalPOSSales)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                <div className="p-2 rounded-lg bg-status-maintenance/10">
                  <BedDouble className="h-5 w-5 text-status-maintenance" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Room Amenity Costs</p>
                  <p className="font-semibold text-foreground">{formatKsh(totalAmenityCosts)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ArrowUpRight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Income Transactions</p>
                  <p className="font-semibold text-foreground">{incomeTransactions.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                <div className="p-2 rounded-lg bg-status-checkout/10">
                  <ArrowDownLeft className="h-5 w-5 text-status-checkout" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expense Transactions</p>
                  <p className="font-semibold text-foreground">{expenseTransactions.length}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted/50 p-1 rounded-full">
                <TabsTrigger
                  value="overview"
                  className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  All Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="pos-sales"
                  className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  POS Sales
                </TabsTrigger>
                <TabsTrigger
                  value="room-costs"
                  className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Room Costs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Financial Chart */}
                <FinanceOverviewChart data={monthlyFinance} />

                {/* Category Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryBreakdownCard 
                    title="Income by Category" 
                    data={incomeBreakdown}
                    colorClass="[&>div]:bg-status-available"
                  />
                  <CategoryBreakdownCard 
                    title="Expenses by Category" 
                    data={expenseBreakdown}
                    colorClass="[&>div]:bg-status-maintenance"
                  />
                </div>

                {/* Recent Transactions */}
                <TransactionHistoryTable transactions={tableTransactions.slice(0, 8)} />
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryBreakdownCard 
                    title="Income by Category" 
                    data={incomeBreakdown}
                    colorClass="[&>div]:bg-status-available"
                  />
                  <CategoryBreakdownCard 
                    title="Expenses by Category" 
                    data={expenseBreakdown}
                    colorClass="[&>div]:bg-status-maintenance"
                  />
                </div>
                <TransactionHistoryTable transactions={tableTransactions} />
              </TabsContent>

              <TabsContent value="pos-sales" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                    <div className="p-2 rounded-lg bg-status-available/10">
                      <Receipt className="h-5 w-5 text-status-available" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total POS Revenue</p>
                      <p className="font-bold text-lg text-foreground">{formatKsh(totalPOSSales)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ArrowUpRight className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="font-bold text-lg text-foreground">{posSalesData.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                    <div className="p-2 rounded-lg bg-status-checkout/10">
                      <Wallet className="h-5 w-5 text-status-checkout" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Transaction</p>
                      <p className="font-bold text-lg text-foreground">
                        {formatKsh(posSalesData.length > 0 ? Math.round(totalPOSSales / posSalesData.length) : 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <POSSalesTable sales={posSalesData} />
              </TabsContent>

              <TabsContent value="room-costs" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                    <div className="p-2 rounded-lg bg-status-maintenance/10">
                      <BedDouble className="h-5 w-5 text-status-maintenance" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amenity Costs</p>
                      <p className="font-bold text-lg text-foreground">{formatKsh(totalAmenityCosts)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Restock Events</p>
                      <p className="font-bold text-lg text-foreground">{restockEvents}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                    <div className="p-2 rounded-lg bg-status-checkout/10">
                      <Wallet className="h-5 w-5 text-status-checkout" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Cost per Restock</p>
                      <p className="font-bold text-lg text-foreground">
                        {formatKsh(roomCostsData.length > 0 ? Math.round(totalAmenityCosts / roomCostsData.length) : 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <RoomAmenityCostsTable costs={roomCostsData} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}
