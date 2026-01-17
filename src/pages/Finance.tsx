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
  BedDouble
} from "lucide-react";
import {
  mockFinanceTransactions,
  mockPOSSalesHistory,
  mockRoomAmenityCosts,
  mockMonthlyFinance,
  calculateFinanceSummary,
  calculateCategoryBreakdown
} from "@/data/mockFinance";
import { formatKsh } from "@/lib/formatters";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const summary = calculateFinanceSummary(mockFinanceTransactions);
  const incomeBreakdown = calculateCategoryBreakdown(mockFinanceTransactions, 'income');
  const expenseBreakdown = calculateCategoryBreakdown(mockFinanceTransactions, 'expense');

  const incomeTransactions = mockFinanceTransactions.filter(t => t.type === 'income');
  const expenseTransactions = mockFinanceTransactions.filter(t => t.type === 'expense');

  const totalPOSSales = mockPOSSalesHistory.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalAmenityCosts = mockRoomAmenityCosts.reduce((sum, c) => sum + c.totalCost, 0);

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
              Jan 2024
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
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
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
            <TabsTrigger value="pos-sales">POS Sales</TabsTrigger>
            <TabsTrigger value="room-costs">Room Costs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Financial Chart */}
            <FinanceOverviewChart data={mockMonthlyFinance} />

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
            <TransactionHistoryTable transactions={mockFinanceTransactions.slice(0, 8)} />
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
            <TransactionHistoryTable transactions={mockFinanceTransactions} />
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
                  <p className="font-bold text-lg text-foreground">{mockPOSSalesHistory.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                <div className="p-2 rounded-lg bg-status-checkout/10">
                  <Wallet className="h-5 w-5 text-status-checkout" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Transaction</p>
                  <p className="font-bold text-lg text-foreground">
                    {formatKsh(Math.round(totalPOSSales / mockPOSSalesHistory.length))}
                  </p>
                </div>
              </div>
            </div>
            <POSSalesTable sales={mockPOSSalesHistory} />
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
                  <p className="font-bold text-lg text-foreground">{mockRoomAmenityCosts.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                <div className="p-2 rounded-lg bg-status-checkout/10">
                  <Wallet className="h-5 w-5 text-status-checkout" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Cost per Restock</p>
                  <p className="font-bold text-lg text-foreground">
                    {formatKsh(Math.round(totalAmenityCosts / mockRoomAmenityCosts.length))}
                  </p>
                </div>
              </div>
            </div>
            <RoomAmenityCostsTable costs={mockRoomAmenityCosts} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
