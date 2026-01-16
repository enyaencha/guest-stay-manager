import { HousekeepingTask } from '@/types/housekeeping';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, User, BedDouble, Play, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: HousekeepingTask;
  onStatusChange?: (taskId: string, status: HousekeepingTask['status']) => void;
}

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', className: 'bg-primary/10 text-primary' },
  high: { label: 'High', className: 'bg-status-maintenance/10 text-status-maintenance' },
  urgent: { label: 'Urgent', className: 'bg-destructive/10 text-destructive' },
};

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-status-checkout/10 text-status-checkout' },
  'in-progress': { label: 'In Progress', className: 'bg-status-cleaning/10 text-status-cleaning' },
  completed: { label: 'Completed', className: 'bg-status-available/10 text-status-available' },
};

const typeLabels = {
  'checkout-clean': 'Checkout Clean',
  'daily-clean': 'Daily Clean',
  'deep-clean': 'Deep Clean',
  'turnover': 'Turnover',
};

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BedDouble className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Room {task.roomNumber}</p>
              <p className="text-xs text-muted-foreground">{task.roomName}</p>
            </div>
          </div>
          <Badge className={cn('text-xs', priority.className)}>
            {priority.label}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {typeLabels[task.type]}
            </Badge>
            <Badge className={cn('text-xs', status.className)}>
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes} min
            </span>
            {task.assignedTo && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assignedTo}
              </span>
            )}
          </div>

          {task.notes && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              {task.notes}
            </p>
          )}

          {task.amenities && task.amenities.length > 0 && (
            <div className="rounded border border-dashed border-border/70 bg-muted/30 p-2 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Amenities to add
              </p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {task.amenities.map((amenity) => (
                  <li key={amenity.name} className="flex items-center justify-between">
                    <span>{amenity.name}</span>
                    <span className="font-medium text-foreground">x{amenity.quantity}</span>
                  </li>
                ))}
              </ul>
              {task.restockNotes && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Cleaner add: {task.restockNotes}
                </p>
              )}
            </div>
          )}
        </div>

        {task.status !== 'completed' && (
          <div className="flex gap-2">
            {task.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => onStatusChange?.(task.id, 'in-progress')}
              >
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
            {task.status === 'in-progress' && (
              <Button
                size="sm"
                className="flex-1 text-xs bg-status-available hover:bg-status-available/90"
                onClick={() => onStatusChange?.(task.id, 'completed')}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
