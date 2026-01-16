import { HousekeepingStaff } from '@/types/housekeeping';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StaffCardProps {
  staff: HousekeepingStaff;
}

export function StaffCard({ staff }: StaffCardProps) {
  const initials = staff.name
    .split(' ')
    .map(n => n[0])
    .join('');

  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{staff.name}</p>
          <Badge
            className={cn(
              'text-xs',
              staff.isAvailable
                ? 'bg-status-available/10 text-status-available'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {staff.isAvailable ? 'Available' : 'Off Duty'}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{staff.tasksAssigned} assigned</span>
          <span>{staff.tasksCompleted} completed</span>
        </div>
      </div>
    </div>
  );
}
