import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { OccupancyChart } from "@/components/reports/OccupancyChart";
import { DepartmentTable } from "@/components/reports/DepartmentTable";
import { TopItemsTable } from "@/components/reports/TopItemsTable";
import { AIInsightsPanel } from "@/components/reports/AIInsightsPanel";
import { ExportReportsPanel } from "@/components/reports/ExportReportsPanel";
import { ForecastChart } from "@/components/reports/ForecastChart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceTransactions } from "@/hooks/useFinance";
import { usePOSTransactions } from "@/hooks/usePOS";
import { useRooms, useRoomStats } from "@/hooks/useRooms";
import { useInventoryItems } from "@/hooks/useInventory";
import { useAIAnalytics } from "@/hooks/useAIAnalytics";
import { 
  DollarSign, 
  BedDouble, 
  CheckCircle, 
  Star,
  Calendar,
  Brain,
  Sparkles,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { formatKsh } from "@/lib/formatters";

const Reports = () => {
  const [dateRange, setDateRange] = useState("7d");
  
  const { data: financeTransactions = [], isLoading: financeLoading } = useFinanceTransactions();
  const { data: posTransactions = [], isLoading: posLoading } = usePOSTransactions();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems();
  const stats = useRoomStats();
  
  const { isLoading: aiLoading, forecast, insights, recommendations, anomalies, analyzeData } = useAIAnalytics();

  const isLoading = financeLoading || posLoading || roomsLoading || inventoryLoading;

  // Calculate stats from real data
  const totalRevenue = financeTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const posRevenue = posTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.total, 0);

  // Mock report stats (would be calculated from real data in production)
  const reportStats = {
    totalRevenue: totalRevenue + posRevenue,
    avgOccupancy: stats.occupancyRate,
    totalTasks: 127, // Would come from housekeeping/maintenance data
    avgSatisfaction: 92, // Would come from guest feedback data
  };

  // Prepare data for charts
  const revenueData = [
    { date: '2026-01-14', roomRevenue: Math.round(totalRevenue * 0.15), posRevenue: Math.round(posRevenue * 0.15), total: Math.round((totalRevenue + posRevenue) * 0.15) },
    { date: '2026-01-15', roomRevenue: Math.round(totalRevenue * 0.18), posRevenue: Math.round(posRevenue * 0.12), total: Math.round((totalRevenue + posRevenue) * 0.16) },
    { date: '2026-01-16', roomRevenue: Math.round(totalRevenue * 0.12), posRevenue: Math.round(posRevenue * 0.18), total: Math.round((totalRevenue + posRevenue) * 0.14) },
    { date: '2026-01-17', roomRevenue: Math.round(totalRevenue * 0.20), posRevenue: Math.round(posRevenue * 0.15), total: Math.round((totalRevenue + posRevenue) * 0.18) },
    { date: '2026-01-18', roomRevenue: Math.round(totalRevenue * 0.15), posRevenue: Math.round(posRevenue * 0.20), total: Math.round((totalRevenue + posRevenue) * 0.17) },
    { date: '2026-01-19', roomRevenue: Math.round(totalRevenue * 0.10), posRevenue: Math.round(posRevenue * 0.10), total: Math.round((totalRevenue + posRevenue) * 0.10) },
    { date: '2026-01-20', roomRevenue: Math.round(totalRevenue * 0.10), posRevenue: Math.round(posRevenue * 0.10), total: Math.round((totalRevenue + posRevenue) * 0.10) },
  ];

  const occupancyData = [
    { date: '2026-01-14', occupancy: 75, rooms: 8 },
    { date: '2026-01-15', occupancy: 82, rooms: 9 },
    { date: '2026-01-16', occupancy: 78, rooms: 8 },
    { date: '2026-01-17', occupancy: 90, rooms: 10 },
    { date: '2026-01-18', occupancy: 85, rooms: 9 },
    { date: '2026-01-19', occupancy: 70, rooms: 7 },
    { date: '2026-01-20', occupancy: stats.occupancyRate, rooms: stats.occupied },
  ];

  const departmentStats = [
    { department: 'Front Desk', tasksCompleted: 45, efficiency: 92, avgResponseTime: 5, satisfaction: 95 },
    { department: 'Housekeeping', tasksCompleted: 38, efficiency: 88, avgResponseTime: 15, satisfaction: 90 },
    { department: 'Maintenance', tasksCompleted: 22, efficiency: 85, avgResponseTime: 30, satisfaction: 88 },
    { department: 'F&B', tasksCompleted: 15, efficiency: 90, avgResponseTime: 10, satisfaction: 92 },
    { department: 'Security', tasksCompleted: 7, efficiency: 95, avgResponseTime: 3, satisfaction: 98 },
  ];

  // Top selling items from POS data
  const topItems = posTransactions
    .filter(t => t.status === 'completed')
    .flatMap(t => Array.isArray(t.items) ? (t.items as { name: string; quantity: number; price: number }[]) : [])
    .reduce((acc, item) => {
      const existing = acc.find(i => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.price;
      } else {
        acc.push({ name: item.name, category: 'POS', quantity: item.quantity, revenue: item.price });
      }
      return acc;
    }, [] as { name: string; category: string; quantity: number; revenue: number }[])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const handleGenerateInsights = async () => {
    await analyzeData('insights', {
      revenueData,
      occupancyData,
    });
    await analyzeData('recommendations', {
      revenueData,
      inventoryData: inventoryItems.map(i => ({
        name: i.name,
        currentStock: i.current_stock,
        minStock: i.min_stock,
        purchasesIn: i.purchases_in || 0,
        stockOut: i.stock_out || 0,
      })),
      expenseData: financeTransactions
        .filter(t => t.type === 'expense')
        .map(t => ({ category: t.category, amount: t.amount, isEtims: true })),
    });
    await analyzeData('anomaly', {
      revenueData,
      occupancyData,
      inventoryData: inventoryItems.map(i => ({
        name: i.name,
        currentStock: i.current_stock,
        minStock: i.min_stock,
        purchasesIn: i.purchases_in || 0,
        stockOut: i.stock_out || 0,
      })),
    });
  };

  const handleGenerateForecast = async () => {
    await analyzeData('forecast', {
      revenueData,
    });
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              AI-powered insights and comprehensive reporting
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Revenue"
                value={formatKsh(reportStats.totalRevenue)}
                icon={DollarSign}
                trend={{ value: 12.5, isPositive: true }}
                description="vs. previous period"
              />
              <StatCard
                title="Avg. Occupancy"
                value={`${reportStats.avgOccupancy}%`}
                icon={BedDouble}
                trend={{ value: 5, isPositive: true }}
                description="Room utilization"
              />
              <StatCard
                title="Tasks Completed"
                value={reportStats.totalTasks}
                icon={CheckCircle}
                trend={{ value: 8, isPositive: true }}
                description="All departments"
              />
              <StatCard
                title="Satisfaction"
                value={`${reportStats.avgSatisfaction}%`}
                icon={Star}
                trend={{ value: 2, isPositive: true }}
                description="Guest rating"
              />
            </div>

            {/* Tabs for different report sections */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="ai-insights" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Insights
                </TabsTrigger>
                <TabsTrigger value="export">Export Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <RevenueChart data={revenueData} />
                  <OccupancyChart data={occupancyData} />
                </div>

                {/* Tables Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <DepartmentTable data={departmentStats} />
                  <TopItemsTable data={topItems} />
                </div>
              </TabsContent>

              <TabsContent value="ai-insights" className="space-y-6">
                <div className="flex gap-3 mb-4">
                  <Button onClick={handleGenerateInsights} disabled={aiLoading}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Insights
                  </Button>
                  <Button variant="outline" onClick={handleGenerateForecast} disabled={aiLoading}>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Forecast
                  </Button>
                </div>
                
                <ForecastChart 
                  forecast={forecast}
                  historicalData={revenueData.map(r => ({ date: r.date, total: r.total }))}
                  isLoading={aiLoading}
                  onRefresh={handleGenerateForecast}
                />
                
                <AIInsightsPanel
                  isLoading={aiLoading}
                  insights={insights}
                  recommendations={recommendations}
                  anomalies={anomalies}
                  onRefresh={handleGenerateInsights}
                />
              </TabsContent>

              <TabsContent value="export">
                <ExportReportsPanel />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Reports;
