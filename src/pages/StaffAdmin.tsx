import { MainLayout } from "@/components/layout/MainLayout";
import { StaffAdminContent } from "@/components/staff/StaffAdminContent";

const StaffAdmin = () => {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage staff accounts, roles, approvals, leaves, and timesheets.
          </p>
        </div>
        <StaffAdminContent />
      </div>
    </MainLayout>
  );
};

export default StaffAdmin;
