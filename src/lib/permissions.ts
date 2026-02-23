// Centralized permission definitions with labels, descriptions, and grouping
export interface PermissionDef {
  key: string;
  label: string;
  description: string;
  group: string;
}

export const ALL_PERMISSIONS: PermissionDef[] = [
  // Dashboard
  { key: "dashboard.view", label: "View Dashboard", description: "See the main dashboard overview", group: "Dashboard" },
  { key: "dashboard.stats", label: "View Statistics", description: "See occupancy, revenue and stat cards", group: "Dashboard" },
  { key: "dashboard.system_status", label: "View System Status", description: "See system health and status widget", group: "Dashboard" },
  { key: "dashboard.quick_actions", label: "Use Quick Actions", description: "Access quick action shortcuts on dashboard", group: "Dashboard" },

  // Rooms
  { key: "rooms.view", label: "View Rooms", description: "See room list, status, and availability", group: "Rooms" },
  { key: "rooms.add", label: "Add Rooms", description: "Create new rooms in the system", group: "Rooms" },
  { key: "rooms.edit", label: "Edit Rooms", description: "Edit room details, pricing, and amenities", group: "Rooms" },
  { key: "rooms.delete", label: "Delete Rooms", description: "Remove rooms from the system", group: "Rooms" },
  { key: "rooms.manage_status", label: "Manage Room Status", description: "Change occupancy and cleaning status", group: "Rooms" },
  { key: "rooms.view_calendar", label: "View Availability Calendar", description: "See room availability calendar view", group: "Rooms" },

  // Guests
  { key: "guests.view", label: "View Guests", description: "See guest profiles and history", group: "Guests" },
  { key: "guests.add", label: "Add Guests", description: "Create new guest profiles", group: "Guests" },
  { key: "guests.edit", label: "Edit Guests", description: "Edit guest information and records", group: "Guests" },
  { key: "guests.delete", label: "Delete Guests", description: "Remove guest records", group: "Guests" },
  { key: "guests.view_history", label: "View Guest History", description: "See full booking and activity history", group: "Guests" },
  { key: "guests.view_id", label: "View Guest ID", description: "See guest ID photos and documents", group: "Guests" },
  { key: "guests.manage_issues", label: "Manage Guest Issues", description: "Log and resolve guest complaints and issues", group: "Guests" },

  // Bookings / Reservations
  { key: "bookings.view", label: "View Bookings", description: "See reservations list and calendar", group: "Bookings" },
  { key: "bookings.create", label: "Create Bookings", description: "Make new reservations and check-ins", group: "Bookings" },
  { key: "bookings.edit", label: "Edit Bookings", description: "Modify booking details and dates", group: "Bookings" },
  { key: "bookings.checkin", label: "Check In Guests", description: "Perform guest check-in process", group: "Bookings" },
  { key: "bookings.checkout", label: "Check Out Guests", description: "Perform guest check-out and room assessment", group: "Bookings" },
  { key: "bookings.cancel", label: "Cancel Bookings", description: "Cancel existing reservations", group: "Bookings" },
  { key: "bookings.assign_room", label: "Assign Rooms", description: "Assign or reassign rooms to bookings", group: "Bookings" },
  { key: "bookings.view_requests", label: "View Reservation Requests", description: "See incoming reservation requests", group: "Bookings" },
  { key: "bookings.approve_requests", label: "Approve Requests", description: "Approve or reject reservation requests", group: "Bookings" },

  // Housekeeping
  { key: "housekeeping.view", label: "View Housekeeping", description: "See tasks and cleaning status", group: "Housekeeping" },
  { key: "housekeeping.create", label: "Create Tasks", description: "Add new housekeeping tasks", group: "Housekeeping" },
  { key: "housekeeping.edit", label: "Edit Tasks", description: "Modify existing housekeeping tasks", group: "Housekeeping" },
  { key: "housekeeping.assign", label: "Assign Tasks", description: "Assign tasks to housekeeping staff", group: "Housekeeping" },
  { key: "housekeeping.complete", label: "Complete Tasks", description: "Mark tasks as complete", group: "Housekeeping" },
  { key: "housekeeping.delete", label: "Delete Tasks", description: "Remove housekeeping tasks", group: "Housekeeping" },
  { key: "housekeeping.manage_staff", label: "Manage HK Staff", description: "Add and manage housekeeping staff members", group: "Housekeeping" },

  // Maintenance
  { key: "maintenance.view", label: "View Maintenance", description: "See reported issues and progress", group: "Maintenance" },
  { key: "maintenance.create", label: "Report Issues", description: "Create new maintenance reports", group: "Maintenance" },
  { key: "maintenance.edit", label: "Edit Issues", description: "Update maintenance issue details", group: "Maintenance" },
  { key: "maintenance.assign", label: "Assign Issues", description: "Assign issues to maintenance staff", group: "Maintenance" },
  { key: "maintenance.resolve", label: "Resolve Issues", description: "Mark issues as resolved", group: "Maintenance" },
  { key: "maintenance.delete", label: "Delete Issues", description: "Remove maintenance records", group: "Maintenance" },
  { key: "maintenance.manage_staff", label: "Manage Maint. Staff", description: "Add and manage maintenance staff members", group: "Maintenance" },

  // Inventory
  { key: "inventory.view", label: "View Inventory", description: "See stock levels and item list", group: "Inventory" },
  { key: "inventory.add", label: "Add Items", description: "Add new inventory items to the system", group: "Inventory" },
  { key: "inventory.edit", label: "Edit Items", description: "Edit inventory item details and pricing", group: "Inventory" },
  { key: "inventory.delete", label: "Delete Items", description: "Remove inventory items", group: "Inventory" },
  { key: "inventory.adjust_stock", label: "Adjust Stock", description: "Add or remove stock quantities", group: "Inventory" },
  { key: "inventory.view_transactions", label: "View Transactions", description: "See stock movement and transaction history", group: "Inventory" },
  { key: "inventory.manage_suppliers", label: "Manage Suppliers", description: "Update supplier information on items", group: "Inventory" },

  // Point of Sale
  { key: "pos.view", label: "View POS", description: "See POS items and transaction history", group: "Point of Sale" },
  { key: "pos.create_sale", label: "Create Sales", description: "Process new sales and orders", group: "Point of Sale" },
  { key: "pos.void_transaction", label: "Void Transactions", description: "Cancel or void completed transactions", group: "Point of Sale" },
  { key: "pos.add_items", label: "Add POS Items", description: "Add new items to the POS catalog", group: "Point of Sale" },
  { key: "pos.edit_items", label: "Edit POS Items", description: "Edit prices and details of POS items", group: "Point of Sale" },
  { key: "pos.delete_items", label: "Delete POS Items", description: "Remove items from the POS catalog", group: "Point of Sale" },
  { key: "pos.view_reports", label: "View POS Reports", description: "See POS sales summaries and reports", group: "Point of Sale" },
  { key: "pos.bill_to_room", label: "Bill to Room", description: "Charge POS sales to a guest's room", group: "Point of Sale" },

  // Finance
  { key: "finance.view", label: "View Finance", description: "See financial reports and summaries", group: "Finance" },
  { key: "finance.view_transactions", label: "View Transactions", description: "See detailed transaction history", group: "Finance" },
  { key: "finance.add_expense", label: "Add Expenses", description: "Record new expenses and costs", group: "Finance" },
  { key: "finance.edit_expense", label: "Edit Expenses", description: "Modify existing expense records", group: "Finance" },
  { key: "finance.delete_expense", label: "Delete Expenses", description: "Remove expense records", group: "Finance" },
  { key: "finance.view_salary", label: "View Salaries", description: "See staff salary information", group: "Finance" },
  { key: "finance.manage_salary", label: "Manage Salaries", description: "Edit and process staff salary payments", group: "Finance" },
  { key: "finance.view_pos_sales", label: "View POS Sales", description: "See POS revenue breakdown in finance", group: "Finance" },
  { key: "finance.view_room_costs", label: "View Room Costs", description: "See room amenity and supply costs", group: "Finance" },

  // Reports
  { key: "reports.view", label: "View Reports", description: "Access analytics and dashboards", group: "Reports" },
  { key: "reports.view_revenue", label: "View Revenue Report", description: "See revenue charts and breakdowns", group: "Reports" },
  { key: "reports.view_occupancy", label: "View Occupancy Report", description: "See occupancy rates and trends", group: "Reports" },
  { key: "reports.view_forecast", label: "View Forecast", description: "See revenue and occupancy forecasts", group: "Reports" },
  { key: "reports.view_satisfaction", label: "View Satisfaction", description: "See guest satisfaction metrics", group: "Reports" },
  { key: "reports.view_department", label: "View Department Stats", description: "See per-department performance data", group: "Reports" },
  { key: "reports.export", label: "Export Reports", description: "Download and export report data to Excel", group: "Reports" },
  { key: "reports.ai_insights", label: "AI Insights", description: "Access AI-generated analytics and insights", group: "Reports" },

  // Refunds
  { key: "refunds.view", label: "View Refunds", description: "See refund requests and status", group: "Refunds" },
  { key: "refunds.create", label: "Request Refunds", description: "Submit new refund requests", group: "Refunds" },
  { key: "refunds.approve", label: "Approve Refunds", description: "Accept or reject refund requests", group: "Refunds" },
  { key: "refunds.edit", label: "Edit Refunds", description: "Modify refund amounts and details", group: "Refunds" },

  // Reviews
  { key: "reviews.view", label: "View Reviews", description: "See guest reviews and ratings", group: "Reviews" },
  { key: "reviews.respond", label: "Respond to Reviews", description: "Write responses to guest reviews", group: "Reviews" },
  { key: "reviews.approve", label: "Approve Reviews", description: "Approve or hide guest reviews", group: "Reviews" },
  { key: "reviews.delete", label: "Delete Reviews", description: "Remove reviews from the system", group: "Reviews" },
  { key: "reviews.send_request", label: "Send Review Requests", description: "Send review request messages to guests", group: "Reviews" },

  // Staff
  { key: "staff.view", label: "View Staff", description: "See employee list and profiles", group: "Staff" },
  { key: "staff.add", label: "Add Staff", description: "Create new staff records", group: "Staff" },
  { key: "staff.edit", label: "Edit Staff", description: "Edit staff profiles and information", group: "Staff" },
  { key: "staff.delete", label: "Delete Staff", description: "Remove staff records", group: "Staff" },
  { key: "staff.manage_roles", label: "Manage Roles", description: "Assign and revoke user roles", group: "Staff" },
  { key: "staff.manage_leave", label: "Manage Leave", description: "Approve and manage leave requests", group: "Staff" },
  { key: "staff.view_timesheets", label: "View Timesheets", description: "See staff attendance and work hours", group: "Staff" },
  { key: "staff.manage_timesheets", label: "Manage Timesheets", description: "Edit and approve timesheet entries", group: "Staff" },
  { key: "staff.bulk_import", label: "Bulk Import Staff", description: "Import multiple staff records at once", group: "Staff" },

  // Settings
  { key: "settings.view", label: "View Settings", description: "See system configuration", group: "Settings" },
  { key: "settings.property", label: "Property Settings", description: "Edit hotel name, address, and branding", group: "Settings" },
  { key: "settings.room_types", label: "Room Types", description: "Manage room type categories and pricing", group: "Settings" },
  { key: "settings.notifications", label: "Notification Settings", description: "Configure notification preferences", group: "Settings" },
  { key: "settings.roles_permissions", label: "Roles & Permissions", description: "Manage roles and permission assignments", group: "Settings" },
  { key: "settings.audit_log", label: "View Audit Log", description: "See system audit trail and activity log", group: "Settings" },
  { key: "settings.system", label: "System Preferences", description: "Change system-level configuration", group: "Settings" },
  { key: "settings.backup", label: "Database Backup", description: "Create and restore database backups", group: "Settings" },
];

export const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map((p) => p.group))];

export const getGroupIcon = (group: string): string => {
  const icons: Record<string, string> = {
    "Dashboard": "🏠",
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
    "Reviews": "⭐",
    "Staff": "👥",
    "Settings": "⚙️",
  };
  return icons[group] || "📋";
};
