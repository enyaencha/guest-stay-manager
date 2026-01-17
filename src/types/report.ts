export interface RevenueData {
  date: string;
  roomRevenue: number;
  posRevenue: number;
  total: number;
}

export interface OccupancyData {
  date: string;
  occupancy: number;
  rooms: number;
}

export interface DepartmentStats {
  department: string;
  tasksCompleted: number;
  avgResponseTime: number;
  satisfaction: number;
}

export interface TopItem {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}
