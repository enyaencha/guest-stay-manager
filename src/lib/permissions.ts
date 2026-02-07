// Centralized permission definitions with labels, descriptions, and grouping
export interface PermissionDef {
  key: string;
  label: string;
  description: string;
  group: string;
}

export const ALL_PERMISSIONS: PermissionDef[] = [
  // Rooms
  { key: "rooms.view", label: "View Rooms", description: "See room list, status, and availability", group: "Rooms" },
  { key: "rooms.manage", label: "Manage Rooms", description: "Edit room details, pricing, and status", group: "Rooms" },

  // Guests
  { key: "guests.view", label: "View Guests", description: "See guest profiles and history", group: "Guests" },
  { key: "guests.manage", label: "Manage Guests", description: "Edit guest information and records", group: "Guests" },

  // Bookings / Reservations
  { key: "bookings.view", label: "View Bookings", description: "See reservations list and calendar", group: "Bookings" },
  { key: "bookings.create", label: "Create Bookings", description: "Make new reservations and check-ins", group: "Bookings" },
  { key: "bookings.manage", label: "Manage Bookings", description: "Modify, cancel, or check out bookings", group: "Bookings" },

  // Housekeeping
  { key: "housekeeping.view", label: "View Housekeeping", description: "See tasks and cleaning status", group: "Housekeeping" },
  { key: "housekeeping.create", label: "Create Tasks", description: "Add new housekeeping tasks", group: "Housekeeping" },
  { key: "housekeeping.manage", label: "Manage Tasks", description: "Assign, reassign, and update all tasks", group: "Housekeeping" },

  // Maintenance
  { key: "maintenance.view", label: "View Maintenance", description: "See reported issues and progress", group: "Maintenance" },
  { key: "maintenance.create", label: "Report Issues", description: "Create new maintenance reports", group: "Maintenance" },
  { key: "maintenance.manage", label: "Manage Issues", description: "Assign, prioritize, and resolve issues", group: "Maintenance" },

  // Inventory
  { key: "inventory.view", label: "View Inventory", description: "See stock levels and transactions", group: "Inventory" },
  { key: "inventory.create", label: "Add Items", description: "Add new inventory items and stock", group: "Inventory" },
  { key: "inventory.manage", label: "Manage Inventory", description: "Adjust stock, write-offs, and suppliers", group: "Inventory" },

  // Point of Sale
  { key: "pos.view", label: "View POS", description: "See POS items and transaction history", group: "Point of Sale" },
  { key: "pos.create", label: "Create Sales", description: "Process new sales and orders", group: "Point of Sale" },
  { key: "pos.manage", label: "Manage POS", description: "Edit items, void transactions, and settings", group: "Point of Sale" },

  // Finance
  { key: "finance.view", label: "View Finance", description: "See financial reports and summaries", group: "Finance" },
  { key: "finance.create", label: "Record Transactions", description: "Add expenses, income entries", group: "Finance" },
  { key: "finance.manage", label: "Manage Finance", description: "Edit records, approve payments, salaries", group: "Finance" },

  // Reports
  { key: "reports.view", label: "View Reports", description: "Access analytics and dashboards", group: "Reports" },
  { key: "reports.export", label: "Export Reports", description: "Download and export report data", group: "Reports" },

  // Refunds
  { key: "refunds.view", label: "View Refunds", description: "See refund requests and status", group: "Refunds" },
  { key: "refunds.create", label: "Request Refunds", description: "Submit new refund requests", group: "Refunds" },
  { key: "refunds.approve", label: "Approve Refunds", description: "Accept or reject refund requests", group: "Refunds" },

  // Staff
  { key: "staff.view", label: "View Staff", description: "See employee list and profiles", group: "Staff" },
  { key: "staff.manage", label: "Manage Staff", description: "Add, edit, and manage staff records", group: "Staff" },

  // Settings
  { key: "settings.view", label: "View Settings", description: "See system configuration", group: "Settings" },
  { key: "settings.manage", label: "Manage Settings", description: "Change system configuration", group: "Settings" },
];

export const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map((p) => p.group))];

export const getGroupIcon = (group: string): string => {
  const icons: Record<string, string> = {
    "Rooms": "🛏️",
    "Guests": "👤",
    "Bookings": "📅",
    "Housekeeping": "🧹",
    "Maintenance": "🔧",
    "Inventory": "📦",
    "Point of Sale": "🛒",
    "Finance": "💰",
    "Reports": "📊",
    "Refunds": "💳",
    "Staff": "👥",
    "Settings": "⚙️",
  };
  return icons[group] || "📋";
};
