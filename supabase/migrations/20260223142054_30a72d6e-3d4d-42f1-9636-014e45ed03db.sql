
-- Add all new granular permission values to the app_permission enum
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'dashboard.view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'dashboard.stats';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'dashboard.system_status';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'dashboard.quick_actions';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'rooms.add';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'rooms.edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'rooms.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'rooms.manage_status';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'rooms.view_calendar';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'guests.add';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'guests.edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'guests.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'guests.view_history';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'guests.view_id';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'guests.manage_issues';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'bookings.edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'bookings.checkin';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'bookings.checkout';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'bookings.cancel';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'bookings.assign_room';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'bookings.view_requests';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'bookings.approve_requests';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'housekeeping.edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'housekeeping.assign';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'housekeeping.complete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'housekeeping.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'housekeeping.manage_staff';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'maintenance.edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'maintenance.assign';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'maintenance.resolve';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'maintenance.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'maintenance.manage_staff';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'inventory.add';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'inventory.edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'inventory.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'inventory.adjust_stock';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'inventory.view_transactions';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'inventory.manage_suppliers';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'pos.create_sale';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'pos.void_transaction';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'pos.add_items';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'pos.edit_items';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'pos.delete_items';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'pos.view_reports';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'pos.bill_to_room';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'finance.view_transactions';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'finance.add_expense';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'finance.edit_expense';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'finance.delete_expense';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'finance.view_salary';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'finance.manage_salary';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'finance.view_pos_sales';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'finance.view_room_costs';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reports.view_revenue';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reports.view_occupancy';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reports.view_forecast';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reports.view_satisfaction';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reports.view_department';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reports.ai_insights';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'refunds.edit';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reviews.view';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reviews.respond';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reviews.approve';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reviews.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'reviews.send_request';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'staff.add';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'staff.edit';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'staff.delete';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'staff.manage_roles';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'staff.manage_leave';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'staff.view_timesheets';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'staff.manage_timesheets';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'staff.bulk_import';

ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.property';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.room_types';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.notifications';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.roles_permissions';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.audit_log';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.system';
ALTER TYPE app_permission ADD VALUE IF NOT EXISTS 'settings.backup';
