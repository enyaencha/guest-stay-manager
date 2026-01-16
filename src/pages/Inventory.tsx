import { MainLayout } from "@/components/layout/MainLayout";
import { Package } from "lucide-react";

const Inventory = () => {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Inventory & Supplies</h1>
          <p className="text-muted-foreground max-w-md">
            Track consumable supplies, manage stock levels, and receive low-stock alerts.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Inventory;
