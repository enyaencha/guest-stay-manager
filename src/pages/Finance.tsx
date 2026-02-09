import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { FinanceOverviewChart } from "@/components/finance/FinanceOverviewChart";
import { CategoryBreakdownCard } from "@/components/finance/CategoryBreakdownCard";
import { TransactionHistoryTable } from "@/components/finance/TransactionHistoryTable";
import { POSSalesTable } from "@/components/finance/POSSalesTable";
import { RoomAmenityCostsTable } from "@/components/finance/RoomAmenityCostsTable";
import { SalaryManagement } from "@/components/finance/SalaryManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { format, parseISO } from "date-fns";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: transactions = [], isLoading: transactionsLoading } = useFinanceTransactions();
  const { data: posTransactions = [], isLoading: posLoading } = usePOSTransactions();
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems();
  
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

  // Build real monthly finance data from transactions
  const monthlyFinance = useMemo(() => {
    const byMonth: Record<string, { income: number; expenses: number }> = {};
    
    transactions.forEach(t => {
      const month = format(parseISO(t.date), "MMM yyyy");
      if (!byMonth[month]) byMonth[month] = { income: 0, expenses: 0 };
      if (t.type === "income") byMonth[month].income += t.amount;
      else byMonth[month].expenses += t.amount;
    });

    // Also include POS sales as income
    posTransactions.filter(t => t.status === 'completed').forEach(t => {
      const month = format(parseISO(t.created_at), "MMM yyyy");
      if (!byMonth[month]) byMonth[month] = { income: 0, expenses: 0 };
      byMonth[month].income += t.total;
    });

    return Object.entries(byMonth)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [transactions, posTransactions]);

  const isLoading = transactionsLoading || posLoading || inventoryLoading || housekeepingLoading;

  const tableTransactions = transactions.map(t => ({
    id: t.id, date: t.date, type: t.type as 'income' | 'expense',
    category: t.category, description: t.description, amount: t.amount,
    paymentStatus: t.payment_status as 'paid' | 'pending' | 'overdue',
    paymentMethod: t.payment_method || undefined,
    reference: t.reference || undefined,
    roomNumber: t.room_number || undefined,
    vendor: t.vendor || undefined,
  }));

  const posSalesData = posTransactions.map(t => ({
    id: t.id, date: t.created_at,
    roomNumber: t.room_number || 'Walk-in',
    items: Array.isArray(t.items) ? (t.items as { name: string; quantity: number; price: number }[]).map(i => i.name).join(', ') : '',
    totalAmount: t.total,
    paymentMethod: t.status === "pending" ? `${t.payment_method} (pending)` : t.payment_method,
    staffName: t.staff_name || 'Unknown',
  }));

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Finance</h1>
            <p className="text-muted-foreground text-sm">
              Track revenue, expenses, and financial performance
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 w-fit">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Income" value={formatKsh(summary.totalIncome)} subtitle="All income" icon={TrendingUp} iconClassName="text-status-available" />
              <StatCard title="Total Expenses" value={formatKsh(summary.totalExpenses)} subtitle="All expenses" icon={TrendingDown} iconClassName="text-status-maintenance" />
              <StatCard title="Net Profit" value={formatKsh(summary.netProfit)} subtitle="Income - Expenses" icon={Wallet} iconClassName="text-primary" />
              <StatCard title="Pending Payments" value={formatKsh(summary.pendingPayments)} subtitle="Awaiting settlement" icon={AlertCircle} iconClassName="text-status-checkout" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="p-2 rounded-lg bg-status-available/10"><Receipt className="h-5 w-5 text-status-available" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">POS Sales</p>
                  <p className="font-semibold text-foreground">{formatKsh(totalPOSSales)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="p-2 rounded-lg bg-status-maintenance/10"><BedDouble className="h-5 w-5 text-status-maintenance" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Room Amenity Costs</p>
                  <p className="font-semibold text-foreground">{formatKsh(totalAmenityCosts)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="p-2 rounded-lg bg-primary/10"><ArrowUpRight className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Income Transactions</p>
                  <p className="font-semibold text-foreground">{incomeTransactions.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                <div className="p-2 rounded-lg bg-status-checkout/10"><ArrowDownLeft className="h-5 w-5 text-status-checkout" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Expense Transactions</p>
                  <p className="font-semibold text-foreground">{expenseTransactions.length}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                <TabsTrigger value="pos-sales">POS Sales</TabsTrigger>
                <TabsTrigger value="room-costs">Room Costs</TabsTrigger>
                <TabsTrigger value="salaries">Salaries</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <FinanceOverviewChart data={monthlyFinance} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryBreakdownCard title="Income by Category" data={incomeBreakdown} colorClass="[&>div]:bg-status-available" />
                  <CategoryBreakdownCard title="Expenses by Category" data={expenseBreakdown} colorClass="[&>div]:bg-status-maintenance" />
                </div>
                <TransactionHistoryTable transactions={tableTransactions.slice(0, 8)} />
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryBreakdownCard title="Income by Category" data={incomeBreakdown} colorClass="[&>div]:bg-status-available" />
                  <CategoryBreakdownCard title="Expenses by Category" data={expenseBreakdown} colorClass="[&>div]:bg-status-maintenance" />
                </div>
                <TransactionHistoryTable transactions={tableTransactions} />
              </TabsContent>

              <TabsContent value="pos-sales" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-status-available/10"><Receipt className="h-5 w-5 text-status-available" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total POS Revenue</p>
                      <p className="font-bold text-lg text-foreground">{formatKsh(totalPOSSales)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-primary/10"><ArrowUpRight className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="font-bold text-lg text-foreground">{posSalesData.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-status-checkout/10"><Wallet className="h-5 w-5 text-status-checkout" /></div>
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
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-status-maintenance/10"><BedDouble className="h-5 w-5 text-status-maintenance" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amenity Costs</p>
                      <p className="font-bold text-lg text-foreground">{formatKsh(totalAmenityCosts)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-primary/10"><Receipt className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Restock Events</p>
                      <p className="font-bold text-lg text-foreground">{restockEvents}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border">
                    <div className="p-2 rounded-lg bg-status-checkout/10"><Wallet className="h-5 w-5 text-status-checkout" /></div>
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

              <TabsContent value="salaries" className="space-y-6">
                <SalaryManagement />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}
