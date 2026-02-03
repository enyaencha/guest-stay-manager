export interface PropertySettings {
  id?: string;
  applySettings?: boolean;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  timezone: string;
  logoUrl?: string;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
  phone: string;
  joinedDate: string;
}

export interface RoomTypeConfig {
  id: string;
  code?: string;
  name: string;
  basePrice: number;
  maxOccupancy: number;
  amenities: string[];
  description: string;
  isActive?: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  lowStockAlerts: boolean;
  maintenanceAlerts: boolean;
  bookingConfirmations: boolean;
  paymentAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
}

export interface SystemPreferences {
  applySettings?: boolean;
  language: string;
  dateFormat: string;
  timeFormat: string;
  autoBackup: boolean;
  maintenanceMode: boolean;
}
