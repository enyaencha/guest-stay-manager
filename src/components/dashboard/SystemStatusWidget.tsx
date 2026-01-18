import { 
  Settings, 
  Cloud, 
  Shield, 
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { mockSystemPreferences, mockPropertySettings, mockNotificationSettings } from "@/data/mockSettings";
import { format } from "date-fns";

interface StatusItemProps {
  label: string;
  status: 'online' | 'warning' | 'offline';
  detail?: string;
}

function StatusItem({ label, status, detail }: StatusItemProps) {
  const statusConfig = {
    online: { icon: CheckCircle2, color: 'text-status-available', bg: 'bg-status-available/10' },
    warning: { icon: AlertTriangle, color: 'text-status-cleaning', bg: 'bg-status-cleaning/10' },
    offline: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  };

  const { icon: Icon, color, bg } = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
        <div className={cn("p-1 rounded-full", bg)}>
          <Icon className={cn("h-3.5 w-3.5", color)} />
        </div>
      </div>
    </div>
  );
}

export function SystemStatusWidget() {
  const lastBackup = new Date();
  lastBackup.setHours(lastBackup.getHours() - 2);

  const systemStatus = {
    database: 'online' as const,
    backup: mockSystemPreferences.autoBackup ? 'online' as const : 'warning' as const,
    notifications: mockNotificationSettings.emailNotifications ? 'online' as const : 'warning' as const,
    maintenance: mockSystemPreferences.maintenanceMode ? 'warning' as const : 'online' as const,
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">System Status</h3>
        </div>
        <Link to="/settings">
          <Button variant="ghost" size="sm">View Settings</Button>
        </Link>
      </div>

      <div className="space-y-1 divide-y divide-border">
        <StatusItem 
          label="Database" 
          status={systemStatus.database}
        />
        <StatusItem 
          label="Auto Backup" 
          status={systemStatus.backup}
          detail={mockSystemPreferences.autoBackup ? format(lastBackup, 'HH:mm') : 'Disabled'}
        />
        <StatusItem 
          label="Notifications" 
          status={systemStatus.notifications}
        />
        <StatusItem 
          label="Maintenance Mode" 
          status={systemStatus.maintenance}
          detail={mockSystemPreferences.maintenanceMode ? 'Active' : 'Off'}
        />
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Last sync: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}
