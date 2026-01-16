import { MaintenanceIssue } from '@/types/maintenance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BedDouble, 
  Wrench, 
  Zap, 
  Droplets, 
  Wind, 
  Tv, 
  Armchair, 
  Building,
  User,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface IssueCardProps {
  issue: MaintenanceIssue;
  onStatusChange?: (issueId: string, status: MaintenanceIssue['status']) => void;
}

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-status-checkout/10 text-status-checkout' },
  high: { label: 'High', className: 'bg-status-maintenance/10 text-status-maintenance' },
  critical: { label: 'Critical', className: 'bg-destructive/10 text-destructive' },
};

const statusConfig = {
  open: { label: 'Open', className: 'bg-status-checkout/10 text-status-checkout' },
  'in-progress': { label: 'In Progress', className: 'bg-status-cleaning/10 text-status-cleaning' },
  resolved: { label: 'Resolved', className: 'bg-status-available/10 text-status-available' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
};

const categoryConfig = {
  plumbing: { label: 'Plumbing', icon: Droplets },
  electrical: { label: 'Electrical', icon: Zap },
  hvac: { label: 'HVAC', icon: Wind },
  appliance: { label: 'Appliance', icon: Tv },
  furniture: { label: 'Furniture', icon: Armchair },
  structural: { label: 'Structural', icon: Building },
  other: { label: 'Other', icon: Wrench },
};

export function IssueCard({ issue, onStatusChange }: IssueCardProps) {
  const priority = priorityConfig[issue.priority];
  const status = statusConfig[issue.status];
  const category = categoryConfig[issue.category];
  const CategoryIcon = category.icon;

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-status-maintenance/10">
              <CategoryIcon className="h-4 w-4 text-status-maintenance" />
            </div>
            <div>
              <p className="font-semibold text-sm">{issue.title}</p>
              <p className="text-xs text-muted-foreground">
                Room {issue.roomNumber} · {issue.roomName}
              </p>
            </div>
          </div>
          <Badge className={cn('text-xs', priority.className)}>
            {priority.label}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {issue.description}
        </p>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {category.label}
            </Badge>
            <Badge className={cn('text-xs', status.className)}>
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(issue.reportedAt), 'MMM d, h:mm a')}
            </span>
            {issue.assignedTo && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {issue.assignedTo}
              </span>
            )}
          </div>
        </div>

        {(issue.status === 'open' || issue.status === 'in-progress') && (
          <div className="flex gap-2">
            {issue.status === 'open' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => onStatusChange?.(issue.id, 'in-progress')}
              >
                <Wrench className="h-3 w-3 mr-1" />
                Start Work
              </Button>
            )}
            {issue.status === 'in-progress' && (
              <Button
                size="sm"
                className="flex-1 text-xs bg-status-available hover:bg-status-available/90"
                onClick={() => onStatusChange?.(issue.id, 'resolved')}
              >
                Mark Resolved
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
