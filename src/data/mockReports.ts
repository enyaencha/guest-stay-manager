import { RevenueData, OccupancyData, DepartmentStats, TopItem } from "@/types/report";
import { roomRevenueJan2026 } from "./mockRooms";
import { stockSummaryJan2026 } from "./mockInventory";

// Real data from ROOMS ANALYSIS JAN 2026.xlsx
// January 2026: 23 total room nights, KSH 30,000 revenue

export const mockRevenueData: RevenueData[] = [
  { date: "Jan 1", roomRevenue: 14000, posRevenue: 2800, total: 16800 }, // 7 basic + 4 standard + 3 superior rooms
  { date: "Jan 2", roomRevenue: 6000, posRevenue: 1500, total: 7500 }, // 1 basic + 3 standard
  { date: "Jan 6", roomRevenue: 2300, posRevenue: 500, total: 2800 }, // 1 superior
  { date: "Jan 11", roomRevenue: 2000, posRevenue: 800, total: 2800 }, // 1 standard (G1)
  { date: "Jan 13", roomRevenue: 2000, posRevenue: 600, total: 2600 }, // 1 standard (G1)
  { date: "Jan 14", roomRevenue: 2000, posRevenue: 700, total: 2700 }, // 1 standard (G1)
  { date: "Jan 15", roomRevenue: 2000, posRevenue: 900, total: 2900 }, // 1 standard (G1)
];

// Occupancy data based on room analysis
// Total rooms: 28 (10 Basic + 9 Standard + 9 Superior)
export const mockOccupancyData: OccupancyData[] = [
  { date: "Jan 1", occupancy: 50, rooms: 14 }, // 7 basic + 4 standard + 3 superior
  { date: "Jan 2", occupancy: 14, rooms: 4 }, // 1 basic + 3 standard
  { date: "Jan 3", occupancy: 0, rooms: 0 },
  { date: "Jan 4", occupancy: 0, rooms: 0 },
  { date: "Jan 5", occupancy: 0, rooms: 0 },
  { date: "Jan 6", occupancy: 4, rooms: 1 }, // 1 superior (F1)
  { date: "Jan 7", occupancy: 0, rooms: 0 },
  { date: "Jan 11", occupancy: 4, rooms: 1 }, // G1 starts
  { date: "Jan 12", occupancy: 0, rooms: 0 },
  { date: "Jan 13", occupancy: 4, rooms: 1 },
  { date: "Jan 14", occupancy: 4, rooms: 1 },
  { date: "Jan 15", occupancy: 4, rooms: 1 },
];

export const mockDepartmentStats: DepartmentStats[] = [
  { department: "Housekeeping", tasksCompleted: 46, avgResponseTime: 20, satisfaction: 94 },
  { department: "Front Desk", tasksCompleted: 23, avgResponseTime: 5, satisfaction: 96 },
  { department: "Maintenance", tasksCompleted: 8, avgResponseTime: 45, satisfaction: 88 },
  { department: "Room Service", tasksCompleted: 15, avgResponseTime: 18, satisfaction: 92 },
];

// Top selling items from POS - based on stock out data
export const mockTopItems: TopItem[] = [
  { name: "Tissues", category: "Room Amenities", quantity: 138, revenue: 0 }, // Room use only
  { name: "Sawa Soap", category: "Bathroom", quantity: 269, revenue: 0 }, // Room use only
  { name: "Water 500ML", category: "Beverages", quantity: 64, revenue: 3200 },
  { name: "Water 1LT", category: "Beverages", quantity: 30, revenue: 3000 },
  { name: "Trust Condoms", category: "Amenities", quantity: 28, revenue: 2800 },
  { name: "Toothpaste & Brush", category: "Amenities", quantity: 23, revenue: 1150 },
  { name: "Soda 500ML", category: "Beverages", quantity: 19, revenue: 1900 },
  { name: "Panadol Extra", category: "Health", quantity: 20, revenue: 600 },
  { name: "Mara Moja", category: "Health", quantity: 18, revenue: 360 },
  { name: "Vaseline", category: "Amenities", quantity: 16, revenue: 800 },
  { name: "Predator Energy", category: "Beverages", quantity: 11, revenue: 1100 },
];

export const calculateReportStats = () => {
  // Using real data from Excel files
  const roomRevenue = roomRevenueJan2026.total.revenue; // KSH 30,000
  const posRevenue = stockSummaryJan2026.stockOutSalesValue; // KSH 14,430
  const totalRevenue = roomRevenue + posRevenue;
  
  const totalNights = roomRevenueJan2026.total.nights; // 23 nights
  const totalRooms = 28;
  const daysInMonth = 31;
  const avgOccupancy = Math.round((totalNights / (totalRooms * daysInMonth)) * 100);
  
  const totalTasks = mockDepartmentStats.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const avgSatisfaction = Math.round(
    mockDepartmentStats.reduce((sum, d) => sum + d.satisfaction, 0) / mockDepartmentStats.length
  );

  return {
    totalRevenue,
    roomRevenue,
    posRevenue,
    avgOccupancy,
    totalTasks,
    avgSatisfaction,
    totalNights,
    purchasesValue: stockSummaryJan2026.purchasesValue, // KSH 5,555
    grossProfit: posRevenue - stockSummaryJan2026.purchasesValue,
  };
};

// Room type breakdown for reports
export const roomTypeBreakdown = [
  { type: "Basic", rooms: 10, rate: 1000, nights: roomRevenueJan2026.basic.nights, revenue: roomRevenueJan2026.basic.revenue },
  { type: "Standard", rooms: 9, rate: 2000, nights: roomRevenueJan2026.standard.nights, revenue: roomRevenueJan2026.standard.revenue },
  { type: "Superior", rooms: 9, rate: 2300, nights: roomRevenueJan2026.superior.nights, revenue: roomRevenueJan2026.superior.revenue },
];

// Payment method breakdown (based on Excel payment columns)
export const paymentMethodBreakdown = [
  { method: "Cash", amount: 0, percentage: 0 },
  { method: "M-Pesa", amount: 0, percentage: 0 },
  { method: "Bank Transfer", amount: 0, percentage: 0 },
];
