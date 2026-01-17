import { GuestRequest } from "@/types/guest";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";

interface RequestCardProps {
  request: GuestRequest;
  onUpdateStatus?: (id: string, status: GuestRequest["status"]) => void;
}

const typeConfig: Record<GuestRequest["type"], { label: string; icon: React.ReactNode }> = {
  amenity: { label: "Amenity", icon: "🛁" },
  service: { label: "Service", icon: "🛎️" },
  maintenance: { label: "Maintenance", icon: "🔧" },
  inquiry: { label: "Inquiry", icon: "❓" },
};

const statusConfig: Record<GuestRequest["status"], { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-status-checkout/20 text-status-checkout" },
  "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  completed: { label: "Completed", className: "bg-status-available/20 text-status-available" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

const priorityConfig: Record<GuestRequest["priority"], { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "High", className: "bg-status-checkout/20 text-status-checkout" },
  urgent: { label: "Urgent", className: "bg-destructive/20 text-destructive" },
};

export const RequestCard = ({ request, onUpdateStatus }: RequestCardProps) => {
  const type = typeConfig[request.type];
  const status = statusConfig[request.status];
  const priority = priorityConfig[request.priority];

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{type.icon}</span>
            <div>
              <p className="font-medium">{request.guestName}</p>
              <p className="text-sm text-muted-foreground">Room {request.roomNumber}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={status.className}>{status.label}</Badge>
            <Badge variant="outline" className={priority.className}>{priority.label}</Badge>
          </div>
        </div>

        <div className="flex items-start gap-2 my-3">
          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-sm">{request.description}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{timeAgo(request.createdAt)}</span>
          </div>
          {request.status === "pending" && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdateStatus?.(request.id, "in-progress")}
              >
                Start
              </Button>
              <Button 
                size="sm"
                onClick={() => onUpdateStatus?.(request.id, "completed")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            </div>
          )}
          {request.status === "in-progress" && (
            <Button 
              size="sm"
              onClick={() => onUpdateStatus?.(request.id, "completed")}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
