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
import { 
  mockRevenueData, 
  mockOccupancyData, 
  mockDepartmentStats, 
  mockTopItems,
  calculateReportStats 
} from "@/data/mockReports";
import { mockInventoryItems } from "@/data/mockInventory";
import { mockExpenseRecords, groupExpensesByCategory } from "@/data/mockExpenses";
import { useAIAnalytics } from "@/hooks/useAIAnalytics";
import { 
  DollarSign, 
  BedDouble, 
  CheckCircle, 
  Star,
  Calendar,
  Brain,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { formatKsh } from "@/lib/formatters";

const Reports = () => {
  const [dateRange, setDateRange] = useState("7d");
  const stats = calculateReportStats();
  const { isLoading, forecast, insights, recommendations, anomalies, analyzeData } = useAIAnalytics();

  const handleGenerateInsights = async () => {
    const expensesByCategory = groupExpensesByCategory(mockExpenseRecords);
    await analyzeData('insights', {
      revenueData: mockRevenueData,
      occupancyData: mockOccupancyData,
    });
    await analyzeData('recommendations', {
      revenueData: mockRevenueData,
      inventoryData: mockInventoryItems.map(i => ({
        name: i.name,
        currentStock: i.currentStock,
        minStock: i.minStock,
        purchasesIn: i.purchasesIn || 0,
        stockOut: i.stockOut || 0,
      })),
      expenseData: expensesByCategory.map(e => ({
        category: e.label,
        amount: e.total,
        isEtims: true,
      })),
    });
    await analyzeData('anomaly', {
      revenueData: mockRevenueData,
      occupancyData: mockOccupancyData,
      inventoryData: mockInventoryItems.map(i => ({
        name: i.name,
        currentStock: i.currentStock,
        minStock: i.minStock,
        purchasesIn: i.purchasesIn || 0,
        stockOut: i.stockOut || 0,
      })),
    });
  };

  const handleGenerateForecast = async () => {
    await analyzeData('forecast', {
      revenueData: mockRevenueData,
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

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatKsh(stats.totalRevenue)}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
            description="vs. previous period"
          />
          <StatCard
            title="Avg. Occupancy"
            value={`${stats.avgOccupancy}%`}
            icon={BedDouble}
            trend={{ value: 5, isPositive: true }}
            description="Room utilization"
          />
          <StatCard
            title="Tasks Completed"
            value={stats.totalTasks}
            icon={CheckCircle}
            trend={{ value: 8, isPositive: true }}
            description="All departments"
          />
          <StatCard
            title="Satisfaction"
            value={`${stats.avgSatisfaction}%`}
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
              <RevenueChart data={mockRevenueData} />
              <OccupancyChart data={mockOccupancyData} />
            </div>

            {/* Tables Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              <DepartmentTable data={mockDepartmentStats} />
              <TopItemsTable data={mockTopItems} />
            </div>
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <div className="flex gap-3 mb-4">
              <Button onClick={handleGenerateInsights} disabled={isLoading}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Insights
              </Button>
              <Button variant="outline" onClick={handleGenerateForecast} disabled={isLoading}>
                <Brain className="h-4 w-4 mr-2" />
                Generate Forecast
              </Button>
            </div>
            
            <ForecastChart 
              forecast={forecast}
              historicalData={mockRevenueData.map(r => ({ date: r.date, total: r.total }))}
              isLoading={isLoading}
              onRefresh={handleGenerateForecast}
            />
            
            <AIInsightsPanel
              isLoading={isLoading}
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
      </div>
    </MainLayout>
  );
};

export default Reports;
