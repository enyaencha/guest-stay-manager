import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatKsh } from "@/lib/formatters";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import type { OverallCondition, MissingItem, IssueType, IssueSeverity } from "@/types/assessment";

interface RoomAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  onComplete?: (hasIssues: boolean) => void;
}

export function RoomAssessmentModal({
  open,
  onOpenChange,
  bookingId,
  guestId,
  guestName,
  roomNumber,
  onComplete,
}: RoomAssessmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallCondition, setOverallCondition] = useState<OverallCondition>("good");
  const [damagesFound, setDamagesFound] = useState(false);
  const [damageDescription, setDamageDescription] = useState("");
  const [damageCost, setDamageCost] = useState(0);
  const [extraCleaning, setExtraCleaning] = useState(false);
  const [notes, setNotes] = useState("");
  const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCost, setNewItemCost] = useState(0);
  
  // Issue tagging
  const [tagIssue, setTagIssue] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>("damage");
  const [issueSeverity, setIssueSeverity] = useState<IssueSeverity>("medium");
  const [issueDescription, setIssueDescription] = useState("");

  const totalMissingCost = missingItems.reduce((sum, item) => sum + item.cost, 0);
  const totalCost = damageCost + totalMissingCost;

  const addMissingItem = () => {
    if (!newItemName.trim()) return;
    setMissingItems([...missingItems, {
      name: newItemName,
      quantity: newItemQty,
      cost: newItemCost,
    }]);
    setNewItemName("");
    setNewItemQty(1);
    setNewItemCost(0);
  };

  const removeMissingItem = (index: number) => {
    setMissingItems(missingItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Insert room assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from("room_assessments")
        .insert([{
          booking_id: bookingId,
          guest_id: guestId,
          room_number: roomNumber,
          overall_condition: overallCondition,
          damages_found: damagesFound,
          damage_description: damagesFound ? damageDescription : null,
          damage_cost: damageCost,
          missing_items: JSON.parse(JSON.stringify(missingItems)),
          extra_cleaning_required: extraCleaning,
          notes: notes || null,
        }])
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // If issue should be tagged to guest
      if (tagIssue && (damagesFound || missingItems.length > 0)) {
        const { error: issueError } = await supabase
          .from("guest_issues")
          .insert([{
            guest_id: guestId,
            booking_id: bookingId,
            room_number: roomNumber,
            issue_type: issueType,
            description: issueDescription || `${damagesFound ? damageDescription : ''} ${missingItems.length > 0 ? `Missing items: ${missingItems.map(i => i.name).join(', ')}` : ''}`.trim(),
            severity: issueSeverity,
            cost_incurred: totalCost,
            resolved: false,
          }]);

        if (issueError) throw issueError;
        toast.warning(`Issue tagged to ${guestName}'s profile`);
      }

      toast.success("Room assessment completed");
      onComplete?.(damagesFound || missingItems.length > 0);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Assessment error:", error);
      toast.error(error.message || "Failed to save assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const conditionColors: Record<OverallCondition, string> = {
    excellent: "bg-green-100 text-green-800",
    good: "bg-blue-100 text-blue-800",
    fair: "bg-yellow-100 text-yellow-800",
    poor: "bg-orange-100 text-orange-800",
    damaged: "bg-red-100 text-red-800",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Room Assessment - Room {roomNumber}</DialogTitle>
          <DialogDescription>
            Assess room condition after checkout for <span className="font-medium">{guestName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Condition */}
          <div className="space-y-2">
            <Label>Overall Room Condition</Label>
            <Select value={overallCondition} onValueChange={(v) => setOverallCondition(v as OverallCondition)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">✨ Excellent</SelectItem>
                <SelectItem value="good">👍 Good</SelectItem>
                <SelectItem value="fair">😐 Fair</SelectItem>
                <SelectItem value="poor">👎 Poor</SelectItem>
                <SelectItem value="damaged">⚠️ Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Damages Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="damages" 
                checked={damagesFound} 
                onCheckedChange={(c) => setDamagesFound(!!c)} 
              />
              <Label htmlFor="damages">Damages Found</Label>
            </div>
            
            {damagesFound && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <Label>Damage Description</Label>
                    <Textarea 
                      placeholder="Describe the damage..."
                      value={damageDescription}
                      onChange={(e) => setDamageDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Estimated Damage Cost (KSH)</Label>
                    <Input 
                      type="number"
                      value={damageCost}
                      onChange={(e) => setDamageCost(Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Missing Items */}
          <div className="space-y-3">
            <Label>Missing Items</Label>
            {missingItems.length > 0 && (
              <div className="space-y-2">
                {missingItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span>{item.name} (x{item.quantity})</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatKsh(item.cost)}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeMissingItem(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input 
                placeholder="Item name"
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
              <Button variant="outline" onClick={addMissingItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Extra Cleaning */}
          <div className="flex items-center gap-2">
            <Checkbox 
              id="cleaning" 
              checked={extraCleaning} 
              onCheckedChange={(c) => setExtraCleaning(!!c)} 
            />
            <Label htmlFor="cleaning">Extra Cleaning Required</Label>
          </div>

          {/* Notes */}
          <div>
            <Label>Additional Notes</Label>
            <Textarea 
              placeholder="Any other observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Tag Issue to Guest */}
          {(damagesFound || missingItems.length > 0) && (
            <Card className="border-warning">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="tagIssue" 
                    checked={tagIssue} 
                    onCheckedChange={(c) => setTagIssue(!!c)} 
                  />
                  <Label htmlFor="tagIssue" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Tag this issue to guest's profile
                  </Label>
                </div>
                
                {tagIssue && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Issue Type</Label>
                        <Select value={issueType} onValueChange={(v) => setIssueType(v as IssueType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="damage">Damage</SelectItem>
                            <SelectItem value="theft">Theft</SelectItem>
                            <SelectItem value="noise_complaint">Noise Complaint</SelectItem>
                            <SelectItem value="policy_violation">Policy Violation</SelectItem>
                            <SelectItem value="late_payment">Late Payment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Severity</Label>
                        <Select value={issueSeverity} onValueChange={(v) => setIssueSeverity(v as IssueSeverity)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Issue Description (optional)</Label>
                      <Textarea 
                        placeholder="Additional details for future reference..."
                        value={issueDescription}
                        onChange={(e) => setIssueDescription(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cost Summary */}
          {totalCost > 0 && (
            <Card className="bg-destructive/10">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Costs to Guest</span>
                  <span className="text-lg font-bold text-destructive">{formatKsh(totalCost)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
