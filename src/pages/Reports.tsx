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
import { useRooms, useRoomStats, useRoomTypes } from "@/hooks/useRooms";
import { useInventoryItems } from "@/hooks/useInventory";
import { useAIAnalytics } from "@/hooks/useAIAnalytics";
import { useBookings } from "@/hooks/useGuests";
import { useHousekeepingTasks } from "@/hooks/useHousekeeping";
import { useMaintenanceIssues } from "@/hooks/useMaintenance";
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
import {
  eachDayOfInterval,
  differenceInCalendarDays,
  differenceInMinutes,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  subDays,
} from "date-fns";

const Reports = () => {
  const [dateRange, setDateRange] = useState("7d");
  
  const { data: financeTransactions = [], isLoading: financeLoading } = useFinanceTransactions();
  const { data: posTransactions = [], isLoading: posLoading } = usePOSTransactions();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: roomTypes = [], isLoading: roomTypesLoading } = useRoomTypes();
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: housekeepingTasks = [], isLoading: housekeepingLoading } = useHousekeepingTasks();
  const { data: maintenanceIssues = [], isLoading: maintenanceLoading } = useMaintenanceIssues();
  const stats = useRoomStats();
  
  const { isLoading: aiLoading, forecast, insights, recommendations, anomalies, analyzeData } = useAIAnalytics();

  const isLoading =
    financeLoading ||
    posLoading ||
    roomsLoading ||
    roomTypesLoading ||
    inventoryLoading ||
    bookingsLoading ||
    housekeepingLoading ||
    maintenanceLoading;

  // Calculate stats from real data
  const totalRevenue = financeTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const posRevenue = posTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.total, 0);

  const rangeDays = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
  const rangeEnd = new Date();
  const rangeStart = subDays(rangeEnd, rangeDays - 1);
  const rangeDaysList = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const periodLabel =
    dateRange === "7d"
      ? "Last 7 Days"
      : dateRange === "30d"
        ? "Last 30 Days"
        : dateRange === "90d"
          ? "Last 90 Days"
          : "Last 12 Months";

  const revenueData = rangeDaysList.map((date) => {
    const roomRevenue = financeTransactions
      .filter((t) => t.type === "income" && isSameDay(parseISO(t.date), date))
      .reduce((sum, t) => sum + t.amount, 0);

    const posRevenueForDay = posTransactions
      .filter((t) => t.status === "completed" && isSameDay(parseISO(t.created_at), date))
      .reduce((sum, t) => sum + t.total, 0);

    return {
      date: format(date, "yyyy-MM-dd"),
      roomRevenue,
      posRevenue: posRevenueForDay,
      total: roomRevenue + posRevenueForDay,
    };
  });

  const occupancyData = rangeDaysList.map((date) => {
    const occupiedRooms = new Set(
      bookings
        .filter((booking) => {
          if (booking.status === "cancelled") return false;
          const checkIn = parseISO(booking.check_in);
          const checkOut = parseISO(booking.check_out);
          return isWithinInterval(date, { start: checkIn, end: checkOut });
        })
        .map((booking) => booking.room_number)
    );

    const occupiedCount = occupiedRooms.size;
    const occupancy = rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 100) : 0;

    return {
      date: format(date, "yyyy-MM-dd"),
      occupancy,
      rooms: occupiedCount,
    };
  });

  const housekeepingCompleted = housekeepingTasks.filter((task) => task.status === "completed").length;
  const maintenanceCompleted = maintenanceIssues.filter((issue) => ["resolved", "closed"].includes(issue.status)).length;
  const frontDeskCompleted = bookings.filter((booking) => booking.status !== "cancelled").length;

  const housekeepingEfficiency = housekeepingTasks.length
    ? Math.round((housekeepingCompleted / housekeepingTasks.length) * 100)
    : 0;
  const maintenanceEfficiency = maintenanceIssues.length
    ? Math.round((maintenanceCompleted / maintenanceIssues.length) * 100)
    : 0;
  const frontDeskEfficiency = bookings.length ? Math.round((frontDeskCompleted / bookings.length) * 100) : 0;

  const departmentStats = [
    {
      department: "Front Desk",
      tasksCompleted: frontDeskCompleted,
      efficiency: frontDeskEfficiency,
      avgResponseTime: 0,
      satisfaction: frontDeskEfficiency,
    },
    {
      department: "Housekeeping",
      tasksCompleted: housekeepingCompleted,
      efficiency: housekeepingEfficiency,
      avgResponseTime:
        housekeepingTasks.length > 0
          ? Math.round(
              housekeepingTasks.reduce((sum, task) => sum + (task.estimated_minutes || 0), 0) /
                housekeepingTasks.length
            )
          : 0,
      satisfaction: housekeepingEfficiency,
    },
    {
      department: "Maintenance",
      tasksCompleted: maintenanceCompleted,
      efficiency: maintenanceEfficiency,
      avgResponseTime: maintenanceIssues.length > 0
        ? Math.round(
            maintenanceIssues.reduce((sum, issue) => {
              if (!issue.resolved_at) return sum;
              return sum + Math.max(0, differenceInMinutes(parseISO(issue.resolved_at), parseISO(issue.reported_at)));
            }, 0) / Math.max(1, maintenanceIssues.filter((issue) => issue.resolved_at).length)
          )
        : 0,
      satisfaction: maintenanceEfficiency,
    },
  ];

  const avgSatisfaction =
    departmentStats.length > 0
      ? Math.round(
          departmentStats.reduce((sum, dept) => sum + (dept.satisfaction || 0), 0) / departmentStats.length
        )
      : 0;

  // Report stats from live data
  const reportStats = {
    totalRevenue: totalRevenue + posRevenue,
    avgOccupancy: stats?.occupancyRate || 0,
    totalTasks: housekeepingTasks.length + maintenanceIssues.length + bookings.length,
    avgSatisfaction,
  };

  // Top selling items from POS data
  const topItems = posTransactions
    .filter(t => t.status === 'completed')
    .flatMap(t => Array.isArray(t.items) ? (t.items as { name: string; quantity: number; price: number }[]) : [])
    .reduce((acc, item) => {
      const existing = acc.find(i => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        acc.push({ name: item.name, category: 'POS', quantity: item.quantity, revenue: item.price * item.quantity });
      }
      return acc;
    }, [] as { name: string; category: string; quantity: number; revenue: number }[])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const roomBreakdown = roomTypes.length
    ? roomTypes.map((roomType) => {
        const roomsForType = rooms.filter((room) => room.room_type_id === roomType.id).length;
        const nights = bookings
          .filter((booking) => booking.room_type?.toLowerCase() === roomType.name.toLowerCase())
          .reduce((sum, booking) => {
            const checkIn = parseISO(booking.check_in);
            const checkOut = parseISO(booking.check_out);
            const start = checkIn > rangeStart ? checkIn : rangeStart;
            const end = checkOut < rangeEnd ? checkOut : rangeEnd;
            return sum + Math.max(0, differenceInCalendarDays(end, start));
          }, 0);

        return {
          type: roomType.name,
          rooms: roomsForType,
          rate: roomType.base_price,
          nights,
          revenue: nights * roomType.base_price,
        };
      })
    : Array.from(
        bookings.reduce((acc, booking) => {
          const type = booking.room_type || "Unknown";
          if (!acc.has(type)) {
            acc.set(type, {
              type,
              rooms: rooms.filter((room) => room.name.toLowerCase() === type.toLowerCase()).length,
              rate: 0,
              nights: 0,
              revenue: 0,
            });
          }

          const entry = acc.get(type)!;
          const checkIn = parseISO(booking.check_in);
          const checkOut = parseISO(booking.check_out);
          const start = checkIn > rangeStart ? checkIn : rangeStart;
          const end = checkOut < rangeEnd ? checkOut : rangeEnd;
          entry.nights += Math.max(0, differenceInCalendarDays(end, start));
          return acc;
        }, new Map())
      ).map(([, value]) => value);

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
                <ExportReportsPanel
                  revenueData={revenueData}
                  occupancyData={occupancyData}
                  inventoryItems={inventoryItems}
                  expenseTransactions={financeTransactions}
                  posTransactions={posTransactions}
                  topItems={topItems}
                  departmentStats={departmentStats}
                  roomBreakdown={roomBreakdown}
                  totalRooms={rooms.length}
                  periodLabel={periodLabel}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Reports;
