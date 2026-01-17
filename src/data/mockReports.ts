import { RevenueData, OccupancyData, DepartmentStats, TopItem } from "@/types/report";

export const mockRevenueData: RevenueData[] = [
  { date: "Jan 10", roomRevenue: 28000, posRevenue: 6500, total: 34500 },
  { date: "Jan 11", roomRevenue: 32000, posRevenue: 7200, total: 39200 },
  { date: "Jan 12", roomRevenue: 36000, posRevenue: 8100, total: 44100 },
  { date: "Jan 13", roomRevenue: 40000, posRevenue: 9500, total: 49500 },
  { date: "Jan 14", roomRevenue: 34000, posRevenue: 7800, total: 41800 },
  { date: "Jan 15", roomRevenue: 42000, posRevenue: 11500, total: 53500 },
  { date: "Jan 16", roomRevenue: 45000, posRevenue: 12500, total: 57500 },
];

export const mockOccupancyData: OccupancyData[] = [
  { date: "Jan 10", occupancy: 72, rooms: 14 },
  { date: "Jan 11", occupancy: 78, rooms: 16 },
  { date: "Jan 12", occupancy: 85, rooms: 17 },
  { date: "Jan 13", occupancy: 90, rooms: 18 },
  { date: "Jan 14", occupancy: 82, rooms: 16 },
  { date: "Jan 15", occupancy: 95, rooms: 19 },
  { date: "Jan 16", occupancy: 88, rooms: 18 },
];

export const mockDepartmentStats: DepartmentStats[] = [
  { department: "Housekeeping", tasksCompleted: 156, avgResponseTime: 25, satisfaction: 94 },
  { department: "Maintenance", tasksCompleted: 42, avgResponseTime: 45, satisfaction: 88 },
  { department: "Front Desk", tasksCompleted: 234, avgResponseTime: 5, satisfaction: 96 },
  { department: "Room Service", tasksCompleted: 89, avgResponseTime: 18, satisfaction: 92 },
];

export const mockTopItems: TopItem[] = [
  { name: "Late Checkout", category: "Services", quantity: 45, revenue: 36000 },
  { name: "Breakfast Buffet", category: "Food & Beverage", quantity: 128, revenue: 83200 },
  { name: "Airport Transfer", category: "Services", quantity: 32, revenue: 57600 },
  { name: "Spa Treatment", category: "Experiences", quantity: 18, revenue: 45000 },
  { name: "Room Service Dinner", category: "Food & Beverage", quantity: 56, revenue: 100800 },
];

export const calculateReportStats = () => {
  const totalRevenue = mockRevenueData.reduce((sum, d) => sum + d.total, 0);
  const avgOccupancy = Math.round(
    mockOccupancyData.reduce((sum, d) => sum + d.occupancy, 0) / mockOccupancyData.length
  );
  const totalTasks = mockDepartmentStats.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const avgSatisfaction = Math.round(
    mockDepartmentStats.reduce((sum, d) => sum + d.satisfaction, 0) / mockDepartmentStats.length
  );

  return {
    totalRevenue,
    avgOccupancy,
    totalTasks,
    avgSatisfaction,
  };
};
