import { MainLayout } from "@/components/layout/MainLayout";
import { Banknote, Broom, ShoppingCart, Sparkles, Timer } from "lucide-react";

const POS = () => {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
            <p className="text-muted-foreground">
              Process upsells, services, and payments. Manage late checkouts, extra cleaning, and more.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Upsells</p>
              <p className="text-sm text-muted-foreground">Offer upgrades and add-ons.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-3 rounded-lg bg-status-available/10">
              <ShoppingCart className="h-5 w-5 text-status-available" />
            </div>
            <div>
              <p className="font-semibold">Services</p>
              <p className="text-sm text-muted-foreground">Room service and amenities.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-3 rounded-lg bg-status-maintenance/10">
              <Timer className="h-5 w-5 text-status-maintenance" />
            </div>
            <div>
              <p className="font-semibold">Late Checkout</p>
              <p className="text-sm text-muted-foreground">Extend stays with fees.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-3 rounded-lg bg-status-checkout/10">
              <Banknote className="h-5 w-5 text-status-checkout" />
            </div>
            <div>
              <p className="font-semibold">Payments</p>
              <p className="text-sm text-muted-foreground">Capture and reconcile.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold">Open Charges</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Room upgrades awaiting approval.</li>
                <li>Minibar and snack replenishments.</li>
                <li>Airport transfer service requests.</li>
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <Broom className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Extra Cleaning</p>
                  <p className="text-sm text-muted-foreground">
                    Add one-time cleaning fees and assign housekeeping tasks.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold">Payment Methods</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Track cash, card, and mobile money collections in one place.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold">Settlement Summary</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Review daily totals and outstanding balances for staff handover.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default POS;
