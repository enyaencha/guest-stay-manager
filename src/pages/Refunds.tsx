import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { RefundApprovalCard } from "@/components/refunds/RefundApprovalCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatKsh } from "@/lib/formatters";
import { 
  ReceiptText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search 
} from "lucide-react";
import type { RefundRequest, RefundStatus, UtilizedItem, RoomAssessment, OverallCondition, MissingItem } from "@/types/assessment";

const Refunds = () => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("refund_requests")
        .select(`
          *,
          guests (name),
          room_assessments (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedRefunds: RefundRequest[] = (data || []).map(r => ({
        id: r.id,
        booking_id: r.booking_id || '',
        guest_id: r.guest_id || undefined,
        room_number: r.room_number,
        amount_paid: Number(r.amount_paid),
        refund_amount: Number(r.refund_amount),
        reason: r.reason,
        room_assessment_id: r.room_assessment_id || undefined,
        items_utilized: Array.isArray(r.items_utilized) ? (r.items_utilized as unknown as UtilizedItem[]) : [],
        deductions: Number(r.deductions) || 0,
        status: r.status as RefundStatus,
        requested_by: r.requested_by || undefined,
        approved_by: r.approved_by || undefined,
        approved_at: r.approved_at || undefined,
        rejection_reason: r.rejection_reason || undefined,
        created_at: r.created_at,
        updated_at: r.updated_at,
        guest_name: r.guests?.name,
        assessment: r.room_assessments ? {
          id: r.room_assessments.id,
          booking_id: r.room_assessments.booking_id || undefined,
          guest_id: r.room_assessments.guest_id || undefined,
          room_number: r.room_assessments.room_number,
          assessed_by: r.room_assessments.assessed_by || undefined,
          assessment_date: r.room_assessments.assessment_date,
          overall_condition: r.room_assessments.overall_condition as OverallCondition,
          damages_found: r.room_assessments.damages_found || false,
          damage_description: r.room_assessments.damage_description || undefined,
          damage_cost: Number(r.room_assessments.damage_cost) || 0,
          missing_items: Array.isArray(r.room_assessments.missing_items) ? (r.room_assessments.missing_items as unknown as MissingItem[]) : [],
          extra_cleaning_required: r.room_assessments.extra_cleaning_required || false,
          notes: r.room_assessments.notes || undefined,
          photos: Array.isArray(r.room_assessments.photos) ? (r.room_assessments.photos as unknown as string[]) : [],
          created_at: r.room_assessments.created_at,
        } : undefined,
      }));

      setRefunds(transformedRefunds);
    } catch (error) {
      console.error("Error fetching refunds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: string, status: RefundStatus) => {
    setRefunds(prev => prev.map(r => 
      r.id === id ? { ...r, status } : r
    ));
  };

  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === "pending").length,
    approved: refunds.filter(r => r.status === "approved" || r.status === "processed").length,
    rejected: refunds.filter(r => r.status === "rejected").length,
    totalValue: refunds
      .filter(r => r.status === "approved" || r.status === "processed")
      .reduce((sum, r) => sum + r.refund_amount, 0),
  };

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = 
      refund.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.room_number.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || refund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refund Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve guest refund requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Requests"
            value={stats.total}
            icon={ReceiptText}
            description="All time"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pending}
            icon={Clock}
            trend={stats.pending > 0 ? { value: stats.pending, isPositive: false } : undefined}
            description="Awaiting review"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle}
            description="Approved/Processed"
          />
          <StatCard
            title="Total Refunded"
            value={formatKsh(stats.totalValue)}
            icon={ReceiptText}
            description="Approved amount"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by guest name or room..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Refund Cards */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading refund requests...
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No refund requests found
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRefunds.map((refund) => (
              <RefundApprovalCard
                key={refund.id}
                refund={refund}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Refunds;
