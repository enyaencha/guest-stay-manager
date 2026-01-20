import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKsh } from "@/lib/formatters";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, AlertCircle, Calculator } from "lucide-react";
import type { UtilizedItem, RoomAssessment, OverallCondition, MissingItem } from "@/types/assessment";

interface RefundRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  amountPaid: number;
  onComplete?: () => void;
}

export function RefundRequestModal({
  open,
  onOpenChange,
  bookingId,
  guestId,
  guestName,
  roomNumber,
  amountPaid,
  onComplete,
}: RefundRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [utilizedItems, setUtilizedItems] = useState<UtilizedItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCost, setNewItemCost] = useState(0);
  const [assessment, setAssessment] = useState<RoomAssessment | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      setLoadingAssessment(true);
      try {
        const { data, error } = await supabase
          .from("room_assessments")
          .select("*")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          const transformedAssessment: RoomAssessment = {
            id: data.id,
            booking_id: data.booking_id || undefined,
            guest_id: data.guest_id || undefined,
            room_number: data.room_number,
            assessed_by: data.assessed_by || undefined,
            assessment_date: data.assessment_date,
            overall_condition: data.overall_condition as OverallCondition,
            damages_found: data.damages_found || false,
            damage_description: data.damage_description || undefined,
            damage_cost: Number(data.damage_cost) || 0,
            missing_items: Array.isArray(data.missing_items) ? (data.missing_items as unknown as MissingItem[]) : [],
            extra_cleaning_required: data.extra_cleaning_required || false,
            notes: data.notes || undefined,
            photos: Array.isArray(data.photos) ? (data.photos as unknown as string[]) : [],
            created_at: data.created_at,
          };
          setAssessment(transformedAssessment);
        }
      } catch (error) {
        console.log("No assessment found");
      } finally {
        setLoadingAssessment(false);
      }
    };

    if (bookingId && open) fetchAssessment();
  }, [bookingId, open]);

  const addUtilizedItem = () => {
    if (!newItemName.trim()) return;
    setUtilizedItems([...utilizedItems, {
      name: newItemName,
      quantity: newItemQty,
      cost: newItemCost,
    }]);
    setNewItemName("");
    setNewItemQty(1);
    setNewItemCost(0);
  };

  const removeUtilizedItem = (index: number) => {
    setUtilizedItems(utilizedItems.filter((_, i) => i !== index));
  };

  const totalUtilizedCost = utilizedItems.reduce((sum, item) => sum + item.cost, 0);
  const assessmentCost = assessment ? (assessment.damage_cost + assessment.missing_items.reduce((sum, i) => sum + i.cost, 0)) : 0;
  const totalDeductions = totalUtilizedCost + assessmentCost;
  const refundAmount = Math.max(0, amountPaid - totalDeductions);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the refund");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("refund_requests")
        .insert([{
          booking_id: bookingId,
          guest_id: guestId,
          room_number: roomNumber,
          amount_paid: amountPaid,
          refund_amount: refundAmount,
          reason: reason,
          room_assessment_id: assessment?.id || null,
          items_utilized: JSON.parse(JSON.stringify(utilizedItems)),
          deductions: totalDeductions,
          status: "pending",
        }]);

      if (error) throw error;

      toast.success("Refund request submitted for approval");
      onComplete?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Refund request error:", error);
      toast.error(error.message || "Failed to submit refund request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refund Request - Room {roomNumber}</DialogTitle>
          <DialogDescription>
            Process refund for <span className="font-medium">{guestName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Info */}
          <Card className="bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <span>Amount Paid by Guest</span>
                <span className="text-xl font-bold text-primary">{formatKsh(amountPaid)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Room Assessment Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Room Assessment
                {loadingAssessment ? (
                  <Badge variant="outline">Loading...</Badge>
                ) : assessment ? (
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                ) : (
                  <Badge variant="destructive">Not Done</Badge>
                )}
              </CardTitle>
            </CardHeader>
            {assessment && (
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Condition:</span>
                  <span className="capitalize">{assessment.overall_condition}</span>
                </div>
                {assessment.damages_found && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Damage Cost:</span>
                    <span className="text-destructive">{formatKsh(assessment.damage_cost)}</span>
                  </div>
                )}
                {assessment.missing_items.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Missing Items:</span>
                    <span className="text-destructive">
                      {formatKsh(assessment.missing_items.reduce((sum, i) => sum + i.cost, 0))}
                    </span>
                  </div>
                )}
              </CardContent>
            )}
            {!loadingAssessment && !assessment && (
              <CardContent>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Room assessment recommended before processing refund
                </p>
              </CardContent>
            )}
          </Card>

          {/* Reason for Refund */}
          <div className="space-y-2">
            <Label>Reason for Refund *</Label>
            <Textarea 
              placeholder="e.g., Guest had emergency and could not stay, Room issue..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Items Utilized */}
          <div className="space-y-3">
            <Label>Items Utilized (Deductions)</Label>
            <p className="text-xs text-muted-foreground">
              Add any supplies or services used that should be deducted from the refund
            </p>
            
            {utilizedItems.length > 0 && (
              <div className="space-y-2">
                {utilizedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span>{item.name} (x{item.quantity})</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-destructive">{formatKsh(item.cost)}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeUtilizedItem(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Input 
                placeholder="Item/Service name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1"
              />
              <Input 
                type="number"
                placeholder="Qty"
                value={newItemQty}
                onChange={(e) => setNewItemQty(Number(e.target.value))}
                className="w-16"
              />
              <Input 
                type="number"
                placeholder="Cost"
                value={newItemCost}
                onChange={(e) => setNewItemCost(Number(e.target.value))}
                className="w-24"
              />
              <Button variant="outline" onClick={addUtilizedItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Refund Calculation */}
          <Card className="bg-muted">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-5 w-5" />
                <span className="font-medium">Refund Calculation</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Amount Paid</span>
                <span>{formatKsh(amountPaid)}</span>
              </div>
              
              {assessmentCost > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Assessment Deductions</span>
                  <span>- {formatKsh(assessmentCost)}</span>
                </div>
              )}
              
              {totalUtilizedCost > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Items Utilized</span>
                  <span>- {formatKsh(totalUtilizedCost)}</span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Refund Amount</span>
                  <span className="text-primary">{formatKsh(refundAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
