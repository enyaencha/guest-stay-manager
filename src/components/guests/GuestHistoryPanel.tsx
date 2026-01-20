import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatKsh } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Calendar, DoorOpen, CheckCircle, XCircle } from "lucide-react";
import type { GuestIssue, IssueSeverity, IssueType } from "@/types/assessment";

interface GuestHistoryPanelProps {
  guestId: string;
  guestName: string;
}

const severityColors: Record<IssueSeverity, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const issueTypeLabels: Record<IssueType, string> = {
  damage: "Damage",
  theft: "Theft",
  noise_complaint: "Noise Complaint",
  policy_violation: "Policy Violation",
  late_payment: "Late Payment",
  other: "Other",
};

export function GuestHistoryPanel({ guestId, guestName }: GuestHistoryPanelProps) {
  const [issues, setIssues] = useState<GuestIssue[]>([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuestHistory = async () => {
      setLoading(true);
      try {
        // Fetch guest issues
        const { data: issuesData, error: issuesError } = await supabase
          .from("guest_issues")
          .select("*")
          .eq("guest_id", guestId)
          .order("created_at", { ascending: false });

        if (issuesError) throw issuesError;
        
        // Transform the data to match our type
        const transformedIssues: GuestIssue[] = (issuesData || []).map(issue => ({
          id: issue.id,
          guest_id: issue.guest_id,
          booking_id: issue.booking_id || undefined,
          room_number: issue.room_number,
          issue_type: issue.issue_type as IssueType,
          description: issue.description,
          severity: issue.severity as IssueSeverity,
          cost_incurred: Number(issue.cost_incurred) || 0,
          resolved: issue.resolved || false,
          notes: issue.notes || undefined,
          created_by: issue.created_by || undefined,
          created_at: issue.created_at,
        }));
        
        setIssues(transformedIssues);

        // Fetch booking count
        const { count, error: countError } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("guest_id", guestId);

        if (!countError) setBookingCount(count || 0);
      } catch (error) {
        console.error("Error fetching guest history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (guestId) fetchGuestHistory();
  }, [guestId]);

  const totalCostIncurred = issues.reduce((sum, i) => sum + i.cost_incurred, 0);
  const unresolvedCount = issues.filter(i => !i.resolved).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading guest history...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Guest History - {guestName}</span>
          {issues.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {issues.length} Issue{issues.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-2xl font-bold">{bookingCount}</div>
            <div className="text-xs text-muted-foreground">Total Stays</div>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{unresolvedCount}</div>
            <div className="text-xs text-muted-foreground">Unresolved Issues</div>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-2xl font-bold">{formatKsh(totalCostIncurred)}</div>
            <div className="text-xs text-muted-foreground">Costs Incurred</div>
          </div>
        </div>

        {/* Issues List */}
        {issues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>No issues recorded for this guest</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {issues.map((issue) => (
                <div 
                  key={issue.id} 
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[issue.severity]}>
                        {issue.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{issueTypeLabels[issue.issue_type]}</Badge>
                    </div>
                    {issue.resolved ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Open
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm">{issue.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-3 w-3" />
                        Room {issue.room_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(issue.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {issue.cost_incurred > 0 && (
                      <span className="font-medium text-destructive">
                        {formatKsh(issue.cost_incurred)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
