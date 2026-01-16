import { MainLayout } from "@/components/layout/MainLayout";
import { Mail, MessageSquare, UserCheck, Users } from "lucide-react";

const Guests = () => {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Guest Management</h1>
            <p className="text-muted-foreground">
              Track guest journeys from booking to checkout. Manage check-ins, requests, and communications.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-3 rounded-lg bg-status-available/10">
              <UserCheck className="h-5 w-5 text-status-available" />
            </div>
            <div>
              <p className="font-semibold">Check-ins</p>
              <p className="text-sm text-muted-foreground">Confirm arrivals and room assignments.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-3 rounded-lg bg-status-maintenance/10">
              <MessageSquare className="h-5 w-5 text-status-maintenance" />
            </div>
            <div>
              <p className="font-semibold">Requests</p>
              <p className="text-sm text-muted-foreground">Track service requests and preferences.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border shadow-card">
            <div className="p-3 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Communications</p>
              <p className="text-sm text-muted-foreground">Send updates before and after stay.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl border shadow-card">
              <div className="p-3 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Guest Timeline</p>
                <p className="text-sm text-muted-foreground">
                  Follow each guest from booking, check-in, stay, and checkout.
                </p>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold">Upcoming Touchpoints</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Send pre-arrival message with directions and arrival time.</li>
                <li>Confirm special requests for early check-in.</li>
                <li>Schedule post-checkout feedback follow-up.</li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold">Guest Notes</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Capture preferences, accessibility needs, and VIP tags to personalize stays.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold">Requests Queue</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Review open requests and route tasks to housekeeping or maintenance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Guests;
