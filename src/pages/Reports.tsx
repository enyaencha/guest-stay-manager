import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { OccupancyChart } from "@/components/reports/OccupancyChart";
import { DepartmentTable } from "@/components/reports/DepartmentTable";
import { TopItemsTable } from "@/components/reports/TopItemsTable";
import { Button } from "@/components/ui/button";
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
import { 
  DollarSign, 
  BedDouble, 
  CheckCircle, 
  Star,
  Download,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { formatKsh } from "@/lib/formatters";

const Reports = () => {
  const [dateRange, setDateRange] = useState("7d");
  const stats = calculateReportStats();

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive overview of property performance
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
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
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
      </div>
    </MainLayout>
  );
};

export default Reports;
