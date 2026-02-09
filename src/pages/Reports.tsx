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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useRooms, useRoomTypes } from "@/hooks/useRooms";
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
  endOfDay,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

type DateRange = {
  start: Date;
  end: Date;
  dayStart: Date;
  dayEnd: Date;
  dayListEnd: Date;
};

const buildRange = (start: Date, end: Date): DateRange => {
  let rangeStart = start;
  let rangeEnd = end;

  if (rangeStart > rangeEnd) {
    [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
  }

  return {
    start: rangeStart,
    end: rangeEnd,
    dayStart: startOfDay(rangeStart),
    dayEnd: endOfDay(rangeEnd),
    dayListEnd: startOfDay(rangeEnd),
  };
};

const formatDateTimeLocal = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

const Reports = () => {
  const [dateRange, setDateRange] = useState("7d");
  const [customStart, setCustomStart] = useState(() =>
    formatDateTimeLocal(subDays(new Date(), 6))
  );
  const [customEnd, setCustomEnd] = useState(() =>
    formatDateTimeLocal(new Date())
  );
  
  const { data: financeTransactions = [], isLoading: financeLoading } = useFinanceTransactions();
  const { data: posTransactions = [], isLoading: posLoading } = usePOSTransactions();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: roomTypes = [], isLoading: roomTypesLoading } = useRoomTypes();
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: housekeepingTasks = [], isLoading: housekeepingLoading } = useHousekeepingTasks();
  const { data: maintenanceIssues = [], isLoading: maintenanceLoading } = useMaintenanceIssues();
  
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

  const isCustomRange = dateRange === "custom";
  const rangeDays =
    dateRange === "7d"
      ? 7
      : dateRange === "30d"
        ? 30
        : dateRange === "90d"
          ? 90
          : dateRange === "custom"
            ? 7
            : 365;

  const now = new Date();
  const parsedCustomStart = customStart ? parseISO(customStart) : null;
  const parsedCustomEnd = customEnd ? parseISO(customEnd) : null;

  let rawRangeStart = subDays(now, rangeDays - 1);
  let rawRangeEnd = now;

  if (isCustomRange) {
    if (parsedCustomStart && parsedCustomEnd) {
      rawRangeStart = parsedCustomStart;
      rawRangeEnd = parsedCustomEnd;
    } else if (parsedCustomStart) {
      rawRangeStart = parsedCustomStart;
      rawRangeEnd = now;
    } else if (parsedCustomEnd) {
      rawRangeStart = subDays(parsedCustomEnd, rangeDays - 1);
      rawRangeEnd = parsedCustomEnd;
    }
  }

  const currentRange = buildRange(rawRangeStart, rawRangeEnd);
  const rangeDurationMs = currentRange.end.getTime() - currentRange.start.getTime();
  const previousRange = buildRange(
    new Date(currentRange.start.getTime() - rangeDurationMs - 1),
    new Date(currentRange.start.getTime() - 1)
  );

  const periodLabel =
    isCustomRange
      ? `${format(currentRange.start, "MMM d, yyyy HH:mm")} - ${format(currentRange.end, "MMM d, yyyy HH:mm")}`
      : dateRange === "7d"
        ? "Last 7 Days"
        : dateRange === "30d"
          ? "Last 30 Days"
          : dateRange === "90d"
            ? "Last 90 Days"
            : "Last 12 Months";

  const isTimestampInRange = (value: string | null | undefined, range: DateRange) => {
    if (!value) return false;
    const date = parseISO(value);
    return isWithinInterval(date, { start: range.start, end: range.end });
  };

  const isDateInRange = (value: string | null | undefined, range: DateRange) => {
    if (!value) return false;
    const date = parseISO(value);
    return isWithinInterval(date, { start: range.dayStart, end: range.dayEnd });
  };

  const isBookingOverlappingRange = (checkIn: string, checkOut: string, range: DateRange) => {
    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);
    return checkInDate <= range.dayEnd && checkOutDate >= range.dayStart;
  };

  const getAverage = (values: number[]) =>
    values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

  const getRevenueTotals = (range: DateRange) => {
    const financeInRange = financeTransactions.filter((t) => isDateInRange(t.date, range));
    const posInRange = posTransactions.filter(
      (t) => t.status === "completed" && isTimestampInRange(t.created_at, range)
    );

    const roomRevenue = financeInRange
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const posRevenue = posInRange.reduce((sum, t) => sum + t.total, 0);

    return {
      financeInRange,
      posInRange,
      roomRevenue,
      posRevenue,
      totalRevenue: roomRevenue + posRevenue,
    };
  };

  const getDepartmentStats = (range: DateRange) => {
    const bookingsInRange = bookings.filter((booking) =>
      isTimestampInRange(booking.created_at, range)
    );
    const housekeepingInRange = housekeepingTasks.filter((task) =>
      isTimestampInRange(task.created_at, range)
    );
    const maintenanceInRange = maintenanceIssues.filter((issue) =>
      isTimestampInRange(issue.reported_at, range)
    );

    const housekeepingCompleted = housekeepingInRange.filter((task) => task.status === "completed").length;
    const maintenanceCompleted = maintenanceInRange.filter((issue) =>
      ["resolved", "closed"].includes(issue.status)
    ).length;
    const frontDeskCompleted = bookingsInRange.filter((booking) => booking.status !== "cancelled").length;

    const housekeepingEfficiency = housekeepingInRange.length
      ? Math.round((housekeepingCompleted / housekeepingInRange.length) * 100)
      : 0;
    const maintenanceEfficiency = maintenanceInRange.length
      ? Math.round((maintenanceCompleted / maintenanceInRange.length) * 100)
      : 0;
    const frontDeskEfficiency = bookingsInRange.length
      ? Math.round((frontDeskCompleted / bookingsInRange.length) * 100)
      : 0;

    return [
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
          housekeepingInRange.length > 0
            ? Math.round(
                housekeepingInRange.reduce((sum, task) => sum + (task.estimated_minutes || 0), 0) /
                  housekeepingInRange.length
              )
            : 0,
        satisfaction: housekeepingEfficiency,
      },
      {
        department: "Maintenance",
        tasksCompleted: maintenanceCompleted,
        efficiency: maintenanceEfficiency,
        avgResponseTime: maintenanceInRange.length > 0
          ? Math.round(
              maintenanceInRange.reduce((sum, issue) => {
                if (!issue.resolved_at) return sum;
                return sum + Math.max(0, differenceInMinutes(parseISO(issue.resolved_at), parseISO(issue.reported_at)));
              }, 0) / Math.max(1, maintenanceInRange.filter((issue) => issue.resolved_at).length)
            )
          : 0,
        satisfaction: maintenanceEfficiency,
      },
    ];
  };

  const buildOccupancyData = (range: DateRange, bookingsForRange: typeof bookings) => {
    const dayList = eachDayOfInterval({ start: range.dayStart, end: range.dayListEnd });

    return dayList.map((date) => {
      const occupiedRooms = new Set(
        bookingsForRange
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
  };

  const currentRevenueTotals = getRevenueTotals(currentRange);
  const previousRevenueTotals = getRevenueTotals(previousRange);

  const rangeDaysList = eachDayOfInterval({
    start: currentRange.dayStart,
    end: currentRange.dayListEnd,
  });

  const revenueData = rangeDaysList.map((date) => {
    const roomRevenue = currentRevenueTotals.financeInRange
      .filter((t) => t.type === "income" && isSameDay(parseISO(t.date), date))
      .reduce((sum, t) => sum + t.amount, 0);

    const posRevenueForDay = currentRevenueTotals.posInRange
      .filter((t) => isSameDay(parseISO(t.created_at), date))
      .reduce((sum, t) => sum + t.total, 0);

    return {
      date: format(date, "yyyy-MM-dd"),
      roomRevenue,
      posRevenue: posRevenueForDay,
      total: roomRevenue + posRevenueForDay,
    };
  });

  const bookingsInRange = bookings.filter((booking) =>
    isBookingOverlappingRange(booking.check_in, booking.check_out, currentRange)
  );
  const previousBookingsInRange = bookings.filter((booking) =>
    isBookingOverlappingRange(booking.check_in, booking.check_out, previousRange)
  );

  const occupancyData = buildOccupancyData(currentRange, bookingsInRange);
  const avgOccupancy = getAverage(occupancyData.map((item) => item.occupancy));
  const previousAvgOccupancy = getAverage(
    buildOccupancyData(previousRange, previousBookingsInRange).map((item) => item.occupancy)
  );

  const departmentStats = getDepartmentStats(currentRange);
  const previousDepartmentStats = getDepartmentStats(previousRange);

  const avgSatisfaction = getAverage(
    departmentStats.map((dept) => (dept.satisfaction ? dept.satisfaction : 0))
  );
  const previousAvgSatisfaction = getAverage(
    previousDepartmentStats.map((dept) => (dept.satisfaction ? dept.satisfaction : 0))
  );

  const totalTasks = departmentStats.reduce((sum, dept) => sum + dept.tasksCompleted, 0);
  const previousTotalTasks = previousDepartmentStats.reduce((sum, dept) => sum + dept.tasksCompleted, 0);

  const reportStats = {
    totalRevenue: currentRevenueTotals.totalRevenue,
    avgOccupancy,
    totalTasks,
    avgSatisfaction,
  };

  const buildTrend = (current: number, previous: number) => {
    if (previous === 0) {
      return {
        value: current === 0 ? 0 : 100,
        isPositive: current >= previous,
        label: "vs previous period",
      };
    }

    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.round(change),
      isPositive: change >= 0,
      label: "vs previous period",
    };
  };

  const revenueTrend = buildTrend(reportStats.totalRevenue, previousRevenueTotals.totalRevenue);
  const occupancyTrend = buildTrend(reportStats.avgOccupancy, previousAvgOccupancy);
  const tasksTrend = buildTrend(reportStats.totalTasks, previousTotalTasks);
  const satisfactionTrend = buildTrend(reportStats.avgSatisfaction, previousAvgSatisfaction);

  const topItems = currentRevenueTotals.posInRange
    .flatMap((t) =>
      Array.isArray(t.items) ? (t.items as { name: string; quantity: number; price: number }[]) : []
    )
    .reduce((acc, item) => {
      const existing = acc.find((i) => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        acc.push({ name: item.name, category: "POS", quantity: item.quantity, revenue: item.price * item.quantity });
      }
      return acc;
    }, [] as { name: string; category: string; quantity: number; revenue: number }[])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const roomBreakdown = roomTypes.length
    ? roomTypes.map((roomType) => {
        const roomsForType = rooms.filter((room) => room.room_type_id === roomType.id).length;
        const nights = bookingsInRange
          .filter((booking) => booking.room_type?.toLowerCase() === roomType.name.toLowerCase())
          .reduce((sum, booking) => {
            const checkIn = parseISO(booking.check_in);
            const checkOut = parseISO(booking.check_out);
            const start = checkIn > currentRange.start ? checkIn : currentRange.start;
            const end = checkOut < currentRange.end ? checkOut : currentRange.end;
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
        bookingsInRange.reduce((acc, booking) => {
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
          const start = checkIn > currentRange.start ? checkIn : currentRange.start;
          const end = checkOut < currentRange.end ? checkOut : currentRange.end;
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
      expenseData: currentRevenueTotals.financeInRange
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
          <div className="flex w-full sm:w-auto flex-col items-start gap-2">
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
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === "custom" && (
              <div className="grid w-full gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="report-start">Start date &amp; time</Label>
                  <Input
                    id="report-start"
                    type="datetime-local"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="report-end">End date &amp; time</Label>
                  <Input
                    id="report-end"
                    type="datetime-local"
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                  />
                </div>
              </div>
            )}
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
                trend={revenueTrend}
                description="vs. previous period"
              />
              <StatCard
                title="Avg. Occupancy"
                value={`${reportStats.avgOccupancy}%`}
                icon={BedDouble}
                trend={occupancyTrend}
                description="Room utilization"
              />
              <StatCard
                title="Tasks Completed"
                value={reportStats.totalTasks}
                icon={CheckCircle}
                trend={tasksTrend}
                description="All departments"
              />
              <StatCard
                title="Satisfaction"
                value={`${reportStats.avgSatisfaction}%`}
                icon={Star}
                trend={satisfactionTrend}
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
                    {aiLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate AI Insights
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleGenerateForecast} disabled={aiLoading}>
                    {aiLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Forecast
                      </>
                    )}
                  </Button>
                </div>

                {aiLoading && (
                  <div
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI analysis in progress. This can take a few seconds.
                  </div>
                )}
                
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
                  expenseTransactions={currentRevenueTotals.financeInRange}
                  posTransactions={currentRevenueTotals.posInRange}
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
