import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatKsh } from "@/lib/formatters";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  DoorOpen, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { RefundRequest, RefundStatus, UtilizedItem } from "@/types/assessment";

interface RefundApprovalCardProps {
  refund: RefundRequest;
  onStatusChange: (id: string, status: RefundStatus) => void;
  readOnly?: boolean;
}

const statusConfig: Record<RefundStatus, { label: string; className: string }> = {
  pending: { label: "Pending Approval", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", className: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
  processed: { label: "Processed", className: "bg-blue-100 text-blue-800" },
};

export function RefundApprovalCard({ refund, onStatusChange, readOnly = false }: RefundApprovalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const status = statusConfig[refund.status];

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("refund_requests")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", refund.id);

      if (error) throw error;

      toast.success("Refund approved");
      onStatusChange(refund.id, "approved");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve refund");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("refund_requests")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
        })
        .eq("id", refund.id);

      if (error) throw error;

      toast.success("Refund rejected");
      onStatusChange(refund.id, "rejected");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject refund");
    } finally {
      setIsProcessing(false);
      setShowRejectInput(false);
    }
  };

  const handleMarkProcessed = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("refund_requests")
        .update({ status: "processed" })
        .eq("id", refund.id);

      if (error) throw error;

      toast.success("Refund marked as processed");
      onStatusChange(refund.id, "processed");
    } catch (error: any) {
      toast.error(error.message || "Failed to process refund");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{refund.guest_name || "Guest"}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DoorOpen className="h-3 w-3" />
                Room {refund.room_number}
              </p>
            </div>
          </div>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Amount Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted p-2 rounded">
            <div className="text-sm font-medium">{formatKsh(refund.amount_paid)}</div>
            <div className="text-xs text-muted-foreground">Paid</div>
          </div>
          <div className="bg-destructive/10 p-2 rounded">
            <div className="text-sm font-medium text-destructive">{formatKsh(refund.deductions)}</div>
            <div className="text-xs text-muted-foreground">Deductions</div>
          </div>
          <div className="bg-primary/10 p-2 rounded">
            <div className="text-sm font-medium text-primary">{formatKsh(refund.refund_amount)}</div>
            <div className="text-xs text-muted-foreground">Refund</div>
          </div>
        </div>

        {/* Reason */}
        <div className="text-sm">
          <span className="font-medium">Reason: </span>
          <span className="text-muted-foreground">{refund.reason}</span>
        </div>

        {/* Expand/Collapse Details */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>Hide Details <ChevronUp className="h-4 w-4 ml-1" /></>
          ) : (
            <>View Details <ChevronDown className="h-4 w-4 ml-1" /></>
          )}
        </Button>

        {expanded && (
          <div className="space-y-3 pt-2 border-t">
            {/* Items Utilized */}
            {refund.items_utilized && refund.items_utilized.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Items Utilized:</p>
                <div className="space-y-1">
                  {refund.items_utilized.map((item: UtilizedItem, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                      <span>{item.name} (x{item.quantity})</span>
                      <span>{formatKsh(item.cost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment Info */}
            {refund.assessment && (
              <div>
                <p className="text-sm font-medium mb-2">Room Assessment:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Condition:</span>
                    <span className="capitalize">{refund.assessment.overall_condition}</span>
                  </div>
                  {refund.assessment.damage_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Damage:</span>
                      <span className="text-destructive">{formatKsh(refund.assessment.damage_cost)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Requested: {new Date(refund.created_at).toLocaleString()}
            </div>
          </div>
        )}

        {/* Rejection Input */}
        {showRejectInput && (
          <div className="space-y-2">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowRejectInput(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleReject}
                disabled={isProcessing}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {refund.status === "pending" && !showRejectInput && !readOnly && (
          <div className="flex gap-2">
            <Button 
              className="flex-1"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowRejectInput(true)}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {refund.status === "approved" && (
          <Button 
            className="w-full"
            variant="outline"
            onClick={handleMarkProcessed}
            disabled={isProcessing}
          >
            <Clock className="h-4 w-4 mr-2" />
            Mark as Processed
          </Button>
        )}

        {refund.status === "rejected" && refund.rejection_reason && (
          <div className="text-sm bg-destructive/10 p-3 rounded">
            <span className="font-medium">Rejection Reason: </span>
            <span className="text-muted-foreground">{refund.rejection_reason}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
