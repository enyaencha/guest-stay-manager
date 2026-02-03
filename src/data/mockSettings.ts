import { PropertySettings, StaffMember, RoomTypeConfig, NotificationSettings, SystemPreferences, UserRole } from '@/types/settings';

export const mockPropertySettings: PropertySettings = {
  applySettings: true,
  name: "Safari Lodge Hotel",
  address: "123 Kenyatta Avenue",
  city: "Nairobi",
  country: "Kenya",
  phone: "+254 700 123 456",
  email: "info@safarilodge.co.ke",
  website: "www.safarilodge.co.ke",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  currency: "KSH",
  timezone: "Africa/Nairobi"
};

export const mockUserRoles: UserRole[] = [
  {
    id: "role-1",
    name: "Administrator",
    permissions: ["all"]
  },
  {
    id: "role-2",
    name: "Manager",
    permissions: ["rooms", "guests", "housekeeping", "maintenance", "reports", "pos", "inventory"]
  },
  {
    id: "role-3",
    name: "Front Desk",
    permissions: ["rooms", "guests", "pos"]
  },
  {
    id: "role-4",
    name: "Housekeeping Supervisor",
    permissions: ["housekeeping", "inventory"]
  },
  {
    id: "role-5",
    name: "Maintenance Staff",
    permissions: ["maintenance"]
  }
];

export const mockStaffMembers: StaffMember[] = [
  {
    id: "staff-1",
    name: "John Kamau",
    email: "john.kamau@safarilodge.co.ke",
    role: "Administrator",
    department: "Management",
    status: "active",
    phone: "+254 700 111 111",
    joinedDate: "2022-01-15"
  },
  {
    id: "staff-2",
    name: "Mary Wanjiku",
    email: "mary.wanjiku@safarilodge.co.ke",
    role: "Manager",
    department: "Operations",
    status: "active",
    phone: "+254 700 222 222",
    joinedDate: "2022-03-20"
  },
  {
    id: "staff-3",
    name: "Peter Ochieng",
    email: "peter.ochieng@safarilodge.co.ke",
    role: "Front Desk",
    department: "Reception",
    status: "active",
    phone: "+254 700 333 333",
    joinedDate: "2023-01-10"
  },
  {
    id: "staff-4",
    name: "Grace Muthoni",
    email: "grace.muthoni@safarilodge.co.ke",
    role: "Housekeeping Supervisor",
    department: "Housekeeping",
    status: "active",
    phone: "+254 700 444 444",
    joinedDate: "2023-02-15"
  },
  {
    id: "staff-5",
    name: "James Kiprotich",
    email: "james.kiprotich@safarilodge.co.ke",
    role: "Maintenance Staff",
    department: "Maintenance",
    status: "inactive",
    phone: "+254 700 555 555",
    joinedDate: "2023-06-01"
  }
];

export const mockRoomTypes: RoomTypeConfig[] = [
  {
    id: "type-1",
    name: "Standard Single",
    basePrice: 5500,
    maxOccupancy: 1,
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Fridge"],
    description: "Comfortable single room with essential amenities"
  },
  {
    id: "type-2",
    name: "Standard Double",
    basePrice: 7500,
    maxOccupancy: 2,
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Fridge", "Safe"],
    description: "Spacious double room with queen-size bed"
  },
  {
    id: "type-3",
    name: "Deluxe Suite",
    basePrice: 12000,
    maxOccupancy: 2,
    amenities: ["WiFi", "Smart TV", "Air Conditioning", "Mini Bar", "Safe", "Balcony", "Room Service"],
    description: "Luxurious suite with premium amenities and city view"
  },
  {
    id: "type-4",
    name: "Family Room",
    basePrice: 15000,
    maxOccupancy: 4,
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Fridge", "Safe", "Extra Beds", "Kids Amenities"],
    description: "Large room ideal for families with children"
  },
  {
    id: "type-5",
    name: "Presidential Suite",
    basePrice: 35000,
    maxOccupancy: 4,
    amenities: ["WiFi", "Smart TV", "Air Conditioning", "Full Bar", "Safe", "Jacuzzi", "Private Balcony", "Butler Service", "Living Room"],
    description: "Our finest accommodation with exclusive services"
  }
];

export const mockNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: true,
  lowStockAlerts: true,
  maintenanceAlerts: true,
  bookingConfirmations: true,
  paymentAlerts: true,
  dailyReports: false,
  weeklyReports: true
};

export const mockSystemPreferences: SystemPreferences = {
  applySettings: true,
  language: "en",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  autoBackup: true,
  maintenanceMode: false
};
