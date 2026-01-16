import { MainLayout } from "@/components/layout/MainLayout";
import { ShoppingCart } from "lucide-react";

const POS = () => {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Point of Sale</h1>
          <p className="text-muted-foreground max-w-md">
            Process upsells, services, and payments. Manage late checkouts, extra cleaning, and more.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default POS;
