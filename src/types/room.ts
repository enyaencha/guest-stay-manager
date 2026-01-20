export type RoomType = 'single' | 'double' | 'suite' | 'villa' | 'apartment';

export type OccupancyStatus = 'vacant' | 'occupied' | 'checkout' | 'reserved';

export type CleaningStatus = 'clean' | 'dirty' | 'in-progress' | 'inspecting';

export type MaintenanceStatus = 'none' | 'pending' | 'in-progress';

export interface Room {
  id: string;
  number: string;
  name: string;
  type: RoomType;
  floor: number;
  maxOccupancy: number;
  occupancyStatus: OccupancyStatus;
  cleaningStatus: CleaningStatus;
  maintenanceStatus: MaintenanceStatus;
  basePrice: number;
  currentGuest?: string;
  checkInDate?: string;
  checkOutDate?: string;
  amenities: string[];
}

export interface DashboardStats {
  totalRooms: number;
  occupied: number;
  vacant: number;
  cleaning: number;
  maintenance: number;
  checkoutsToday: number;
  checkinsToday: number;
  occupancyRate: number;
}
