import { MainLayout } from "@/components/layout/MainLayout";
import { Users } from "lucide-react";

const Guests = () => {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Guest Management</h1>
          <p className="text-muted-foreground max-w-md">
            Track guest journeys from booking to checkout. Manage check-ins, requests, and communications.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Guests;
