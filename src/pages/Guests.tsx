import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { GuestCard } from "@/components/guests/GuestCard";
import { RequestCard } from "@/components/guests/RequestCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockGuests, mockGuestRequests } from "@/data/mockGuests";
import { Guest, GuestRequest } from "@/types/guest";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Clock, 
  Plus, 
  Search,
  Bell
} from "lucide-react";
import { toast } from "sonner";

const Guests = () => {
  const [guests, setGuests] = useState<Guest[]>(mockGuests);
  const [requests, setRequests] = useState<GuestRequest[]>(mockGuestRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const stats = {
    totalGuests: guests.length,
    checkedIn: guests.filter(g => g.status === "checked-in").length,
    preArrival: guests.filter(g => g.status === "pre-arrival").length,
    pendingRequests: requests.filter(r => r.status === "pending").length,
  };

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.roomNumber.includes(searchTerm) ||
      guest.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || guest.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCheckIn = (id: string) => {
    setGuests(prev => prev.map(g => 
      g.id === id ? { ...g, status: "checked-in" as const } : g
    ));
    toast.success("Guest checked in successfully");
  };

  const handleCheckOut = (id: string) => {
    setGuests(prev => prev.map(g => 
      g.id === id ? { ...g, status: "checked-out" as const } : g
    ));
    toast.success("Guest checked out successfully");
  };

  const handleUpdateRequestStatus = (id: string, status: GuestRequest["status"]) => {
    setRequests(prev => prev.map(r => 
      r.id === id ? { ...r, status } : r
    ));
    toast.success(`Request marked as ${status}`);
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Guest Management</h1>
            <p className="text-muted-foreground">
              Track guest journeys from booking to checkout
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Guests"
            value={stats.totalGuests}
            icon={Users}
            description="Active bookings"
          />
          <StatCard
            title="Checked In"
            value={stats.checkedIn}
            icon={UserCheck}
            trend={{ value: 12, isPositive: true }}
            description="Currently staying"
          />
          <StatCard
            title="Arriving Today"
            value={stats.preArrival}
            icon={Clock}
            description="Expected check-ins"
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={Bell}
            trend={{ value: 3, isPositive: false }}
            description="Awaiting action"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="guests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="requests">Requests ({requests.filter(r => r.status !== "completed").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="guests" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, room, or email..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="checked-in">Checked In</TabsTrigger>
                  <TabsTrigger value="pre-arrival">Pre-Arrival</TabsTrigger>
                  <TabsTrigger value="checked-out">Checked Out</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Guest Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredGuests.map((guest) => (
                <GuestCard 
                  key={guest.id} 
                  guest={guest}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                />
              ))}
            </div>

            {filteredGuests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No guests found matching your criteria
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {requests
                .filter(r => r.status !== "completed" && r.status !== "cancelled")
                .map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request}
                    onUpdateStatus={handleUpdateRequestStatus}
                  />
                ))}
            </div>

            {requests.filter(r => r.status !== "completed" && r.status !== "cancelled").length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No pending requests
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Guests;
